use std::collections::HashSet;
use std::time::{Duration, Instant};

use anchor_lang::error::Error;
use anchor_lang::prelude::{AccountInfo, Pubkey};
use anchor_lang::{AccountDeserialize, AccountSerialize, Space};
use susu::curve::calculate_collateral;
use susu::error::SusuError;
use susu::instructions::accept_invite::apply_accept_invite;
use susu::instructions::claim_payout::{
    assert_rotation_closed, assert_rotation_recipient, calculate_payout_amount,
    rotation_close_timestamp, verify_rotation_funded,
};
use susu::instructions::complete_group::complete_group_after_all_rotation_receipts;
use susu::instructions::invite_members::apply_invite_members;
use susu::instructions::start_contributions::assign_rotation_slots_for_start;
use susu::seeds::{GROUP_SEED, MEMBER_SEED, ROTATION_SEED};
use susu::state::{
    ContributionRecord, CurveParams, Group, GroupStatus, MemberPosition, RotationReceipt,
    SlashStatus,
};
use susu::ID;

const N: u8 = 5;
const CONTRIBUTION_AMOUNT: u64 = 10;
const MINT_DECIMALS: u8 = 6;

fn assert_susu_error<T: std::fmt::Debug>(result: anchor_lang::Result<T>, expected: SusuError) {
    match result {
        Err(Error::AnchorError(error)) => {
            assert_eq!(error.error_code_number, u32::from(expected));
            assert_eq!(error.error_name, expected.name());
        }
        other => panic!("expected {expected:?}, got {other:?}"),
    }
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

fn derive_rotation_receipt_pda(group: Pubkey, rotation_index: u8) -> Pubkey {
    Pubkey::find_program_address(
        &[
            ROTATION_SEED,
            group.as_ref(),
            rotation_index.to_le_bytes().as_ref(),
        ],
        &ID,
    )
    .0
}

fn group_fixture(creator: Pubkey, group_key: Pubkey) -> Group {
    let _ = group_key;
    Group {
        mint: Pubkey::new_unique(),
        contribution_amount: CONTRIBUTION_AMOUNT,
        contribution_period: 30,
        n: N,
        curve_params: CurveParams {},
        members: Vec::new(),
        status: GroupStatus::Forming,
        created_at: 1,
        creator,
        group_id: 46,
        bump: 255,
        start_timestamp: 1,
        contribution_window_duration: 30,
        slash_grace_seconds: 30,
    }
}

fn accepted_position_template(group_key: Pubkey, member: Pubkey) -> MemberPosition {
    MemberPosition {
        group: group_key,
        member_pubkey: member,
        rotation_slot: u8::MAX,
        contribution_history: (0..N)
            .map(|rotation_index| ContributionRecord {
                rotation_index,
                amount: 0,
                paid_at: 0,
            })
            .collect(),
        collateral_posted: 0,
        slash_status: SlashStatus::None,
    }
}

fn serialize_account<T: AccountSerialize + Space>(account: &T) -> Vec<u8> {
    let mut data = vec![0_u8; 8 + T::INIT_SPACE];
    let mut writer: &mut [u8] = &mut data;
    account
        .try_serialize(&mut writer)
        .expect("serialize account");
    data
}

fn member_position_account(position: &MemberPosition) -> AccountInfo<'static> {
    let key = Box::leak(Box::new(derive_member_position_pda(
        position.group,
        position.member_pubkey,
    )));
    let lamports = Box::leak(Box::new(1_u64));
    let data = Box::leak(serialize_account(position).into_boxed_slice());

    AccountInfo::new(key, false, true, lamports, data, &ID, false)
}

fn read_position(account: &AccountInfo) -> MemberPosition {
    let data = account.try_borrow_data().expect("borrow position data");
    let mut body: &[u8] = &data;
    MemberPosition::try_deserialize(&mut body).expect("deserialize position")
}

fn write_position(account: &AccountInfo, position: &MemberPosition) {
    let mut data = account.try_borrow_mut_data().expect("borrow position data");
    let mut writer: &mut [u8] = &mut data;
    position
        .try_serialize(&mut writer)
        .expect("serialize updated position");
}

fn rotation_receipt_account(receipt: &RotationReceipt) -> AccountInfo<'static> {
    let key = Box::leak(Box::new(derive_rotation_receipt_pda(
        receipt.group,
        receipt.rotation_index,
    )));
    let lamports = Box::leak(Box::new(1_u64));
    let data = Box::leak(serialize_account(receipt).into_boxed_slice());

    AccountInfo::new(key, false, false, lamports, data, &ID, false)
}

fn withdraw_all_collateral(positions: &mut [MemberPosition], vault_balance: &mut u64) {
    for position in positions {
        *vault_balance = vault_balance
            .checked_sub(position.collateral_posted)
            .expect("vault holds posted collateral");
        position.collateral_posted = 0;
    }
}

#[test]
fn story_4_6_full_lifecycle() {
    let started = Instant::now();
    let creator = Pubkey::new_unique();
    let group_key = derive_group_pda(creator, 46);
    let mut group = group_fixture(creator, group_key);
    let members: Vec<_> = (0..N).map(|_| Pubkey::new_unique()).collect();

    apply_invite_members(&mut group, members.clone()).expect("invite exact roster");

    let mut positions: Vec<_> = members
        .iter()
        .copied()
        .map(|member| {
            apply_accept_invite(&mut group, member).expect("accepted invited member");
            accepted_position_template(group_key, member)
        })
        .collect();
    assert!(group.members.iter().all(|member| member.accepted));

    let assignments = susu::rotation::calculate_rotation_assignments(group_key, &members)
        .expect("deterministic assignments");
    let mut vault_balance = 0_u64;
    for position in &mut positions {
        let assignment = assignments
            .iter()
            .find(|assignment| assignment.member_pubkey == position.member_pubkey)
            .expect("assignment for member");
        position.collateral_posted =
            calculate_collateral(assignment.slot, N, CONTRIBUTION_AMOUNT, MINT_DECIMALS)
                .expect("collateral requirement");
        vault_balance = vault_balance
            .checked_add(position.collateral_posted)
            .expect("modeled collateral balance");
    }

    let position_accounts: Vec<_> = positions.iter().map(member_position_account).collect();
    assign_rotation_slots_for_start(
        group_key,
        &group,
        &position_accounts,
        group.contribution_amount,
        MINT_DECIMALS,
    )
    .expect("start assigns slots for collateralized members");
    group.status = GroupStatus::Active;
    group.start_timestamp = 100;

    positions = position_accounts.iter().map(read_position).collect();
    let realized_slots: HashSet<_> = positions
        .iter()
        .map(|position| position.rotation_slot)
        .collect();
    assert_eq!(realized_slots.len(), usize::from(N));

    let mut claimed_receipts = HashSet::new();
    let mut receipt_accounts = Vec::with_capacity(usize::from(N));
    for rotation_index in 0..N {
        for (position, account) in positions.iter_mut().zip(position_accounts.iter()) {
            position.contribution_history[usize::from(rotation_index)].amount = CONTRIBUTION_AMOUNT;
            position.contribution_history[usize::from(rotation_index)].paid_at = group
                .start_timestamp
                .checked_add(i64::from(rotation_index) * group.contribution_period)
                .and_then(|timestamp| timestamp.checked_add(1))
                .expect("contribution timestamp");
            write_position(account, position);
            vault_balance = vault_balance
                .checked_add(CONTRIBUTION_AMOUNT)
                .expect("modeled contribution balance");
        }

        let recipient = positions
            .iter()
            .find(|position| position.rotation_slot == rotation_index)
            .expect("recipient for realized slot");
        let wrong_recipient = positions
            .iter()
            .find(|position| position.rotation_slot != rotation_index)
            .expect("non-recipient for guard");
        assert_susu_error(
            assert_rotation_recipient(wrong_recipient, rotation_index),
            SusuError::NotRotationRecipient,
        );
        assert_rotation_recipient(recipient, rotation_index).expect("realized recipient can claim");

        let deadline = rotation_close_timestamp(
            group.start_timestamp,
            group.contribution_period,
            rotation_index,
        )
        .expect("rotation deadline");
        assert_susu_error(
            assert_rotation_closed(deadline, deadline),
            SusuError::ContributionPeriodOpen,
        );
        assert_rotation_closed(deadline + 1, deadline).expect("claim after close");
        verify_rotation_funded(group_key, &group, rotation_index, &position_accounts)
            .expect("every member funded rotation");

        let amount = calculate_payout_amount(N, CONTRIBUTION_AMOUNT).expect("payout amount");
        let receipt_key = derive_rotation_receipt_pda(group_key, rotation_index);
        assert!(
            claimed_receipts.insert(receipt_key),
            "duplicate receipt PDA would be rejected before a second transfer"
        );
        vault_balance = vault_balance
            .checked_sub(amount)
            .expect("modeled payout balance");
        let receipt = RotationReceipt {
            group: group_key,
            rotation_index,
            amount,
            recipient: recipient.member_pubkey,
            claimed_at: deadline + 1,
            bump: 255,
        };
        assert_eq!(receipt.recipient, recipient.member_pubkey);
        assert_eq!(receipt.amount, amount);
        receipt_accounts.push(rotation_receipt_account(&receipt));
    }

    complete_group_after_all_rotation_receipts(group_key, &mut group, &receipt_accounts)
        .expect("all receipts complete group");
    assert_eq!(group.status, GroupStatus::Completed);

    withdraw_all_collateral(&mut positions, &mut vault_balance);
    for position in &positions {
        assert_eq!(position.collateral_posted, 0);
    }
    assert_eq!(vault_balance, 0);

    let elapsed = started.elapsed();
    assert!(
        elapsed < Duration::from_secs(30),
        "fallback lifecycle exceeded budget: {elapsed:?}"
    );
}
