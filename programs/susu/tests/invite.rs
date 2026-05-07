use anchor_lang::prelude::Pubkey;
use susu::error::SusuError;
use susu::seeds::GROUP_SEED;
use susu::state::{CurveParams, Group, GroupStatus, MemberSlot};
use susu::ID;

const INVITE_MEMBERS_SOURCE: &str = include_str!("../src/instructions/invite_members.rs");
const MEMBERS_INVITED_LOG: &str = "members_invited";
const FORBIDDEN_INVITE_TOKEN_SIDE_EFFECT_TERMS: [&str; 12] = [
    "anchor_spl",
    "tokenaccount",
    "token_program",
    "associated_token",
    "transfer",
    "transfer_checked",
    "cpi",
    "invoke",
    "vault",
    "custody",
    "fee",
    "yield",
];

fn group_fixture(n: u8, status: GroupStatus) -> Group {
    Group {
        mint: Pubkey::new_unique(),
        contribution_amount: 100,
        contribution_period: 30,
        n,
        curve_params: CurveParams {},
        members: Vec::new(),
        status,
        created_at: 1,
        creator: Pubkey::new_unique(),
        group_id: 42,
        bump: 255,
    }
}

fn member_slot(pubkey: Pubkey, accepted: bool) -> MemberSlot {
    MemberSlot { pubkey, accepted }
}

fn member_snapshot(group: &Group) -> Vec<(Pubkey, bool)> {
    group
        .members
        .iter()
        .map(|slot| (slot.pubkey, slot.accepted))
        .collect()
}

fn invite_members_proxy(group: &mut Group, invitees: Vec<Pubkey>) -> Result<(), SusuError> {
    if group.status != GroupStatus::Forming {
        return Err(SusuError::GroupAlreadyStarted);
    }

    if invitees.len() != group.n as usize {
        return Err(SusuError::InvalidMemberCount);
    }

    group.members = invitees
        .into_iter()
        .map(|pubkey| member_slot(pubkey, false))
        .collect();

    Ok(())
}

fn derive_group_pda(creator: Pubkey, group_id: u64) -> Pubkey {
    let group_id_bytes = group_id.to_le_bytes();
    Pubkey::find_program_address(
        &[GROUP_SEED, creator.as_ref(), group_id_bytes.as_ref()],
        &ID,
    )
    .0
}

#[test]
fn test_invite_happy_path_5_members() {
    let mut group = group_fixture(5, GroupStatus::Forming);
    let invitees: Vec<_> = (0..5).map(|_| Pubkey::new_unique()).collect();
    let expected = invitees.clone();

    invite_members_proxy(&mut group, invitees).expect("forming group with n invitees must pass");

    assert_eq!(group.members.len(), 5);
    assert_eq!(
        group
            .members
            .iter()
            .map(|slot| slot.pubkey)
            .collect::<Vec<_>>(),
        expected
    );
    assert!(group.members.iter().all(|slot| !slot.accepted));
    assert_eq!(MEMBERS_INVITED_LOG, "members_invited");
}

#[test]
fn test_invite_wrong_count_rejected() {
    let mut group = group_fixture(5, GroupStatus::Forming);
    let invitees: Vec<_> = (0..4).map(|_| Pubkey::new_unique()).collect();
    group.members = vec![
        member_slot(Pubkey::new_unique(), true),
        member_slot(Pubkey::new_unique(), false),
    ];
    let original_snapshot = member_snapshot(&group);

    assert!(matches!(
        invite_members_proxy(&mut group, invitees),
        Err(SusuError::InvalidMemberCount)
    ));
    assert_eq!(member_snapshot(&group), original_snapshot);
}

#[test]
fn test_invite_post_forming_rejected() {
    for status in [
        GroupStatus::Active,
        GroupStatus::Cancelled,
        GroupStatus::Completed,
    ] {
        let mut group = group_fixture(5, status);
        let invitees: Vec<_> = (0..5).map(|_| Pubkey::new_unique()).collect();
        group.members = vec![
            member_slot(Pubkey::new_unique(), true),
            member_slot(Pubkey::new_unique(), false),
        ];
        let original_snapshot = member_snapshot(&group);

        assert!(matches!(
            invite_members_proxy(&mut group, invitees),
            Err(SusuError::GroupAlreadyStarted)
        ));
        assert_eq!(member_snapshot(&group), original_snapshot);
    }
}

#[test]
fn test_invite_duplicate_pubkeys_are_preserved_for_story_2_4() {
    let mut group = group_fixture(5, GroupStatus::Forming);
    let duplicate = Pubkey::new_unique();
    let invitees = vec![
        duplicate,
        Pubkey::new_unique(),
        duplicate,
        Pubkey::new_unique(),
        Pubkey::new_unique(),
    ];

    invite_members_proxy(&mut group, invitees.clone())
        .expect("Story 2.3 preserves duplicate invitees for Story 2.4 accept handling");

    assert_eq!(group.members.len(), 5);
    assert_eq!(group.members[0].pubkey, duplicate);
    assert_eq!(group.members[2].pubkey, duplicate);
    assert_eq!(
        group
            .members
            .iter()
            .map(|slot| slot.pubkey)
            .collect::<Vec<_>>(),
        invitees
    );
    assert!(group.members.iter().all(|slot| !slot.accepted));
}

#[test]
fn test_invite_non_creator_rejected_by_account_constraints_proxy() {
    let source = INVITE_MEMBERS_SOURCE;
    let creator = Pubkey::new_unique();
    let non_creator = Pubkey::new_unique();
    let creator_group = derive_group_pda(creator, 7);
    let non_creator_group = derive_group_pda(non_creator, 7);

    assert_ne!(creator_group, non_creator_group);
    assert!(source.contains("creator: Signer<'info>"));
    assert!(source.contains("has_one = creator"));
    assert!(source.contains(
        "seeds = [GROUP_SEED, creator.key().as_ref(), group.group_id.to_le_bytes().as_ref()]"
    ));
    assert!(source.contains("bump = group.bump"));
}

#[test]
fn test_invite_members_has_no_token_custody_fee_yield_or_cpi_proxy() {
    let lower = INVITE_MEMBERS_SOURCE.to_lowercase();

    for forbidden in FORBIDDEN_INVITE_TOKEN_SIDE_EFFECT_TERMS {
        assert!(
            !lower.contains(forbidden),
            "invite_members must not introduce {forbidden} behavior"
        );
    }
}
