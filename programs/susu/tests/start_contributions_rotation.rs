use std::collections::HashSet;

use anchor_lang::prelude::{AccountInfo, Pubkey};
use anchor_lang::{AccountDeserialize, AccountSerialize, Space};
use susu::instructions::start_contributions::assign_rotation_slots_for_start;
use susu::seeds::{GROUP_SEED, MEMBER_SEED};
use susu::state::{ContributionRecord, CurveParams, Group, GroupStatus, MemberPosition, MemberSlot, SlashStatus};
use susu::ID;

fn derive_group_pda(creator: Pubkey, group_id: u64) -> Pubkey {
    Pubkey::find_program_address(
        &[GROUP_SEED, creator.as_ref(), group_id.to_le_bytes().as_ref()],
        &ID,
    )
    .0
}

fn derive_member_position_pda(group: Pubkey, member: Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[MEMBER_SEED, group.as_ref(), member.as_ref()], &ID).0
}

fn group_fixture(members: Vec<Pubkey>) -> Group {
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
        status: GroupStatus::Forming,
        created_at: 1,
        creator: Pubkey::new_unique(),
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
    position.try_serialize(&mut writer).expect("serialize member position");
    data
}

fn read_position(account: &AccountInfo) -> MemberPosition {
    let data = account.try_borrow_data().expect("borrow account data");
    let mut body: &[u8] = &data;
    MemberPosition::try_deserialize(&mut body).expect("deserialize member position")
}

fn member_position_account(group_key: Pubkey, member: Pubkey, n: u8) -> AccountInfo<'static> {
    let key = Box::leak(Box::new(derive_member_position_pda(group_key, member)));
    let lamports = Box::leak(Box::new(1_u64));
    let position = MemberPosition {
        group: group_key,
        member_pubkey: member,
        rotation_slot: u8::MAX,
        contribution_history: (0..n)
            .map(|rotation_index| ContributionRecord {
                rotation_index,
                amount: 0,
                paid_at: 0,
            })
            .collect(),
        collateral_posted: 1_000,
        slash_status: SlashStatus::None,
    };
    let data = Box::leak(serialize_position(&position).into_boxed_slice());

    AccountInfo::new(key, false, true, lamports, data, &ID, false)
}

#[test]
fn start_assignment_writes_final_slots_into_member_position_accounts() {
    let creator = Pubkey::new_unique();
    let group_key = derive_group_pda(creator, 42);
    let members: Vec<_> = (0..5).map(|_| Pubkey::new_unique()).collect();
    let mut group = group_fixture(members.clone());
    group.creator = creator;

    let accounts: Vec<_> = members
        .iter()
        .copied()
        .map(|member| member_position_account(group_key, member, group.n))
        .collect();

    let assignments = assign_rotation_slots_for_start(group_key, &group, &accounts, group.contribution_amount, 6)
        .expect("assignment must pass for accepted, collateralized members");

    let assigned_slots: HashSet<u8> = assignments.iter().map(|assignment| assignment.slot).collect();
    assert_eq!(assigned_slots.len(), usize::from(group.n));

    for account in &accounts {
        let position = read_position(account);
        assert_ne!(position.rotation_slot, u8::MAX);
        assert!(assigned_slots.contains(&position.rotation_slot));
        let expected = assignments
            .iter()
            .find(|assignment| assignment.member_pubkey == position.member_pubkey)
            .expect("assignment for account member");
        assert_eq!(position.rotation_slot, expected.slot);
    }
}
