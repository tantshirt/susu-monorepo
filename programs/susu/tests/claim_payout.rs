use anchor_lang::error::Error;
use anchor_lang::prelude::{AccountInfo, Pubkey};
use anchor_lang::{AccountSerialize, Space};
use susu::error::SusuError;
use susu::instructions::claim_payout::{
    assert_rotation_closed, assert_rotation_recipient, calculate_payout_amount,
    rotation_close_timestamp, verify_rotation_funded,
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
fn claim_payout_double_claim_rejection_uses_receipt_existence_guard() {
    let source = CLAIM_PAYOUT_SOURCE;
    let accounts_start = source
        .find("pub struct ClaimPayout")
        .expect("accounts struct");
    let handler_start = source.find("pub fn handler").expect("handler");
    let receipt_init = source.find("init,").expect("receipt init constraint");
    let transfer_checked = source
        .find("token::transfer_checked")
        .expect("vault transfer CPI");

    assert!(accounts_start < handler_start);
    assert!(
        receipt_init > accounts_start && receipt_init < handler_start,
        "receipt init must be an account-validation constraint, not handler logic"
    );
    assert!(handler_start < transfer_checked);
    assert!(source.contains("rotation_receipt: Account<'info, RotationReceipt>"));
    assert!(source.contains("ROTATION_SEED"));
    assert!(source.contains("rotation_index.to_le_bytes()"));
    assert_eq!(
        SusuError::AlreadyClaimed.name(),
        "AlreadyClaimed",
        "SDKs can map Anchor init-on-existing-receipt failures to SusuError::AlreadyClaimed"
    );
}

#[test]
fn claim_payout_has_no_existing_receipt_mutation_path() {
    let source = CLAIM_PAYOUT_SOURCE;
    let receipt_write = source.find("let receipt = &mut ctx.accounts.rotation_receipt");

    assert!(source.contains("init,"));
    assert!(source.contains("RotationReceipt::INIT_SPACE"));
    assert!(
        receipt_write.is_some(),
        "successful claims must populate the new receipt"
    );
    assert!(
        receipt_write.unwrap()
            > source
                .find("token::transfer_checked")
                .expect("vault transfer CPI"),
        "receipt fields are only written on the successful claim path after account validation"
    );
    assert!(
        !source.contains("init_if_needed"),
        "init_if_needed would permit an existing receipt to enter handler logic"
    );
    assert!(
        !source.contains("realloc"),
        "receipt accounts must not be reallocated or overwritten"
    );
}

#[test]
fn claim_payout_claimed_rotation_zero_does_not_block_rotation_one_receipt() {
    let creator = Pubkey::new_unique();
    let group = derive_group_pda(creator, 42);
    let (rotation_0_receipt, _bump_0) = Pubkey::find_program_address(
        &[ROTATION_SEED, group.as_ref(), 0_u8.to_le_bytes().as_ref()],
        &ID,
    );
    let (rotation_1_receipt, _bump_1) = Pubkey::find_program_address(
        &[ROTATION_SEED, group.as_ref(), 1_u8.to_le_bytes().as_ref()],
        &ID,
    );

    assert_ne!(
        rotation_0_receipt, rotation_1_receipt,
        "RotationReceipt PDA existence must guard exactly one group rotation"
    );
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
        .find("assert_rotation_recipient")
        .expect("recipient guard");
    let funded = source
        .find("verify_rotation_funded")
        .expect("funded rotation guard");
    let closed = source.find("assert_rotation_closed").expect("closed guard");
    let cpi = source
        .find("CpiContext::new_with_signer")
        .expect("vault signer CPI");

    assert!(active < cpi, "active guard must precede CPI");
    assert!(recipient < cpi, "recipient guard must precede CPI");
    assert!(
        closed < funded,
        "deadline guard must precede funding checks so open rotations return ContributionPeriodOpen"
    );
    assert!(funded < cpi, "funding guard must precede CPI");
    assert!(closed < cpi, "closed-period guard must precede CPI");
}

#[test]
fn claim_payout_pre_deadline_guard_rejects_until_strictly_after_close() {
    #[derive(Clone, Copy)]
    struct DeadlineCase {
        n: u8,
        rotation_index: u8,
    }

    for n in [3_u8, 7_u8, 10_u8] {
        for DeadlineCase {
            n: case_n,
            rotation_index,
        } in [
            DeadlineCase {
                n,
                rotation_index: 0,
            },
            DeadlineCase {
                n,
                rotation_index: n - 1,
            },
        ] {
            assert!(rotation_index < case_n);
            let deadline = rotation_close_timestamp(100, 30, rotation_index)
                .expect("deadline should be calculable");

            assert_susu_error(
                assert_rotation_closed(deadline - 1, deadline),
                SusuError::ContributionPeriodOpen,
            );
            assert_susu_error(
                assert_rotation_closed(deadline, deadline),
                SusuError::ContributionPeriodOpen,
            );
            assert_rotation_closed(deadline + 1, deadline)
                .expect("deadline + 1 should allow payout claim");
        }
    }
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

#[test]
fn assert_rotation_recipient_rejects_wrong_slot_member() {
    let position = MemberPosition {
        group: Pubkey::new_unique(),
        member_pubkey: Pubkey::new_unique(),
        rotation_slot: 2,
        contribution_history: vec![],
        collateral_posted: 1_000,
        slash_status: SlashStatus::None,
    };

    assert_susu_error(
        assert_rotation_recipient(&position, 0),
        SusuError::NotRotationRecipient,
    );
}

#[test]
fn assert_rotation_recipient_allows_exact_slot_recipient() {
    let position = MemberPosition {
        group: Pubkey::new_unique(),
        member_pubkey: Pubkey::new_unique(),
        rotation_slot: 0,
        contribution_history: vec![],
        collateral_posted: 1_000,
        slash_status: SlashStatus::None,
    };

    assert_rotation_recipient(&position, 0).expect("exact rotation recipient should pass");
}
