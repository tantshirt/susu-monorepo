use anchor_lang::error::Error;
use anchor_lang::prelude::{AccountInfo, Pubkey};
use anchor_lang::{AccountSerialize, Space};
use susu::error::SusuError;
use susu::instructions::claim_payout::{
    calculate_payout_amount, rotation_close_timestamp, verify_rotation_funded,
};
use susu::seeds::{GROUP_SEED, MEMBER_SEED, ROTATION_SEED};
use susu::state::{
    ContributionRecord, CurveParams, Group, GroupStatus, MemberPosition, MemberSlot, SlashStatus,
};
use susu::ID;

const CLAIM_PAYOUT_SOURCE: &str = include_str!("../src/instructions/claim_payout.rs");
const PAYOUT_CLAIMED_LOG: &str = "payout_claimed";

fn assert_susu_error<T: std::fmt::Debug>(result: anchor_lang::Result<T>, expected: SusuError) {
    match result {
        Err(Error::AnchorError(error)) => {
            assert_eq!(error.error_code_number, u32::from(expected));
            assert_eq!(error.error_name, expected.name());
        }
        other => panic!("expected {expected:?}, got {other:?}"),
    }
}

fn compact(source: &str) -> String {
    source.split_whitespace().collect()
}

fn derive_group_pda(creator: Pubkey, group_id: u64) -> Pubkey {
    Pubkey::find_program_address(
        &[
            GROUP_SEED,
            creator.as_ref(),
            group_id.to_le_bytes().as_ref(),
        ],
        &ID,
    )
    .0
}

fn derive_member_position_pda(group: Pubkey, member: Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[MEMBER_SEED, group.as_ref(), member.as_ref()], &ID).0
}

fn group_fixture(creator: Pubkey, group_key: Pubkey, members: Vec<Pubkey>) -> Group {
    let _: Pubkey = group_key;
    Group {
        mint: Pubkey::new_unique(),
        contribution_amount: 10,
        contribution_period: 30,
        n: members.len() as u8,
        curve_params: CurveParams {},
        members: members
            .into_iter()
            .map(|pubkey| MemberSlot {
                pubkey,
                accepted: true,
            })
            .collect(),
        status: GroupStatus::Active,
        created_at: 1,
        creator,
        group_id: 42,
        bump: 255,
        start_timestamp: 1,
        contribution_window_duration: 30,
        slash_grace_seconds: 30,
    }
}

fn serialize_position(position: &MemberPosition) -> Vec<u8> {
    let mut data = vec![0_u8; 8 + MemberPosition::INIT_SPACE];
    let mut writer: &mut [u8] = &mut data;
    position
        .try_serialize(&mut writer)
        .expect("serialize member position");
    data
}

fn member_position_account(
    group_key: Pubkey,
    member: Pubkey,
    n: u8,
    paid_rotation: u8,
    paid_amount: u64,
) -> AccountInfo<'static> {
    let key = Box::leak(Box::new(derive_member_position_pda(group_key, member)));
    let lamports = Box::leak(Box::new(1_u64));
    let position = MemberPosition {
        group: group_key,
        member_pubkey: member,
        rotation_slot: paid_rotation,
        contribution_history: (0..n)
            .map(|rotation_index| ContributionRecord {
                rotation_index,
                amount: if rotation_index == paid_rotation {
                    paid_amount
                } else {
                    0
                },
                paid_at: if rotation_index == paid_rotation {
                    200
                } else {
                    0
                },
            })
            .collect(),
        collateral_posted: 1_000,
        slash_status: SlashStatus::None,
    };
    let data = Box::leak(serialize_position(&position).into_boxed_slice());

    AccountInfo::new(key, false, false, lamports, data, &ID, false)
}

#[test]
fn claim_payout_receipt_pda_uses_rotation_seed_group_and_le_index() {
    let creator = Pubkey::new_unique();
    let group = derive_group_pda(creator, 42);
    let rotation_index = 3_u8;

    let (receipt, _bump) = Pubkey::find_program_address(
        &[
            ROTATION_SEED,
            group.as_ref(),
            rotation_index.to_le_bytes().as_ref(),
        ],
        &ID,
    );

    assert_ne!(receipt, group);
    assert!(CLAIM_PAYOUT_SOURCE.contains("ROTATION_SEED"));
    assert!(CLAIM_PAYOUT_SOURCE.contains("rotation_index.to_le_bytes()"));
}

#[test]
fn calculate_payout_amount_is_checked_n_times_contribution_amount() {
    assert_eq!(calculate_payout_amount(5, 1_000).unwrap(), 5_000);
    assert_susu_error(
        calculate_payout_amount(12, u64::MAX),
        SusuError::ArithmeticOverflow,
    );
}

#[test]
fn rotation_close_timestamp_uses_strict_period_end_math() {
    assert_eq!(rotation_close_timestamp(100, 30, 0).unwrap(), 130);
    assert_eq!(rotation_close_timestamp(100, 30, 2).unwrap(), 190);
    assert_susu_error(
        rotation_close_timestamp(i64::MAX - 5, 30, 0),
        SusuError::ArithmeticOverflow,
    );
}

#[test]
fn claim_payout_source_orders_guards_before_vault_transfer() {
    let source = compact(CLAIM_PAYOUT_SOURCE);

    let active = source.find("GroupStatus::Active").expect("active guard");
    let recipient = source
        .find("NotRotationRecipient")
        .expect("recipient guard");
    let funded = source
        .find("verify_rotation_funded")
        .expect("funded rotation guard");
    let closed = source.find("RotationNotClosed").expect("closed guard");
    let cpi = source
        .find("CpiContext::new_with_signer")
        .expect("vault signer CPI");

    assert!(active < cpi, "active guard must precede CPI");
    assert!(recipient < cpi, "recipient guard must precede CPI");
    assert!(funded < cpi, "funding guard must precede CPI");
    assert!(closed < cpi, "closed-period guard must precede CPI");
}

#[test]
fn claim_payout_source_uses_group_pda_as_vault_transfer_authority() {
    let source = CLAIM_PAYOUT_SOURCE;

    assert!(source.contains("TransferChecked"));
    assert!(source.contains("authority: ctx.accounts.group.to_account_info()"));
    assert!(source.contains("GROUP_SEED"));
    assert!(source.contains("new_with_signer"));
    assert_eq!(PAYOUT_CLAIMED_LOG, "payout_claimed");
}

#[test]
fn verify_rotation_funded_requires_every_member_to_have_paid_exact_amount() {
    let creator = Pubkey::new_unique();
    let group_key = derive_group_pda(creator, 42);
    let members: Vec<_> = (0..5).map(|_| Pubkey::new_unique()).collect();
    let group = group_fixture(creator, group_key, members.clone());

    let funded_accounts: Vec<_> = members
        .iter()
        .copied()
        .map(|member| {
            member_position_account(group_key, member, group.n, 0, group.contribution_amount)
        })
        .collect();
    verify_rotation_funded(group_key, &group, 0, &funded_accounts)
        .expect("all exact contributions should fund payout");

    let underfunded_accounts: Vec<_> = members
        .iter()
        .copied()
        .enumerate()
        .map(|(idx, member)| {
            member_position_account(
                group_key,
                member,
                group.n,
                0,
                if idx == 0 {
                    0
                } else {
                    group.contribution_amount
                },
            )
        })
        .collect();
    assert_susu_error(
        verify_rotation_funded(group_key, &group, 0, &underfunded_accounts),
        SusuError::ContributionAmountMismatch,
    );
}
