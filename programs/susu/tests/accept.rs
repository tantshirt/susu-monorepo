use anchor_lang::error::Error;
use anchor_lang::prelude::Pubkey;
use susu::error::SusuError;
use susu::instructions::accept_invite::apply_accept_invite;
use susu::seeds::{GROUP_SEED, MEMBER_SEED};
use susu::state::{
    ContributionRecord, CurveParams, Group, GroupStatus, MemberPosition, MemberSlot, SlashStatus,
};
use susu::ID;

const ACCEPT_INVITE_SOURCE: &str = include_str!("../src/instructions/accept_invite.rs");
const MEMBER_ACCEPTED_LOG: &str = "member_accepted";
const ACCOUNT_ALREADY_INITIALIZED: &str = "AccountAlreadyInitialized";
const FORBIDDEN_ACCEPT_INVITE_SIDE_EFFECT_TERMS: [&str; 12] = [
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

fn group_fixture(n: u8, status: GroupStatus, members: Vec<MemberSlot>) -> Group {
    Group {
        mint: Pubkey::new_unique(),
        contribution_amount: 100,
        contribution_period: 30,
        n,
        curve_params: CurveParams {},
        members,
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

fn derive_group_pda(creator: Pubkey, group_id: u64) -> Pubkey {
    let group_id_bytes = group_id.to_le_bytes();
    Pubkey::find_program_address(
        &[GROUP_SEED, creator.as_ref(), group_id_bytes.as_ref()],
        &ID,
    )
    .0
}

fn derive_member_position_pda(group: Pubkey, member: Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[MEMBER_SEED, group.as_ref(), member.as_ref()], &ID).0
}

fn new_member_position(group: Pubkey, member_pubkey: Pubkey) -> MemberPosition {
    MemberPosition {
        group,
        member_pubkey,
        rotation_slot: u8::MAX,
        contribution_history: Vec::<ContributionRecord>::new(),
        collateral_posted: 0,
        slash_status: SlashStatus::None,
    }
}

fn assert_susu_error(result: anchor_lang::Result<()>, expected: SusuError) {
    match result {
        Err(Error::AnchorError(error)) => {
            assert_eq!(error.error_code_number, u32::from(expected));
            assert_eq!(error.error_name, expected.name());
        }
        other => panic!("expected {expected:?}, got {other:?}"),
    }
}

#[test]
fn test_accept_invite_happy_path() {
    let invitee = Pubkey::new_unique();
    let mut group = group_fixture(
        3,
        GroupStatus::Forming,
        vec![
            member_slot(invitee, false),
            member_slot(Pubkey::new_unique(), false),
            member_slot(Pubkey::new_unique(), false),
        ],
    );
    let group_pda = derive_group_pda(group.creator, group.group_id);
    let member_position_pda = derive_member_position_pda(group_pda, invitee);

    apply_accept_invite(&mut group, invitee).expect("invited forming member can accept");
    let member_position = new_member_position(group_pda, invitee);

    assert_ne!(member_position_pda, group_pda);
    assert!(group.members[0].accepted);
    assert_eq!(group.members[0].pubkey, invitee);
    assert!(!group.members[1].accepted);
    assert!(!group.members[2].accepted);
    assert_eq!(member_position.group, group_pda);
    assert_eq!(member_position.member_pubkey, invitee);
    assert_eq!(member_position.rotation_slot, u8::MAX);
    assert_eq!(member_position.collateral_posted, 0);
    assert!(member_position.contribution_history.is_empty());
    assert!(matches!(member_position.slash_status, SlashStatus::None));
    assert_eq!(MEMBER_ACCEPTED_LOG, "member_accepted");
}

#[test]
fn test_accept_invite_not_invited() {
    let invitee = Pubkey::new_unique();
    let not_invited = Pubkey::new_unique();
    let mut group = group_fixture(3, GroupStatus::Forming, vec![member_slot(invitee, false)]);
    let original_snapshot = member_snapshot(&group);

    assert_susu_error(
        apply_accept_invite(&mut group, not_invited),
        SusuError::MemberNotInvited,
    );
    assert_eq!(member_snapshot(&group), original_snapshot);
}

#[test]
fn test_accept_invite_double_accept() {
    let invitee = Pubkey::new_unique();
    let mut group = group_fixture(3, GroupStatus::Forming, vec![member_slot(invitee, false)]);

    apply_accept_invite(&mut group, invitee).expect("first accept succeeds");
    let accepted_snapshot = member_snapshot(&group);

    assert_susu_error(
        apply_accept_invite(&mut group, invitee),
        SusuError::AlreadyAccepted,
    );
    assert_eq!(ACCOUNT_ALREADY_INITIALIZED, "AccountAlreadyInitialized");
    assert_eq!(member_snapshot(&group), accepted_snapshot);
}

#[test]
fn test_accept_invite_rejects_non_forming_and_cancelled_groups() {
    let invitee = Pubkey::new_unique();

    for (status, expected_error) in [
        (GroupStatus::Active, SusuError::GroupAlreadyStarted),
        (GroupStatus::Completed, SusuError::GroupAlreadyStarted),
        (GroupStatus::Cancelled, SusuError::GroupCancelled),
    ] {
        let mut group = group_fixture(3, status, vec![member_slot(invitee, false)]);
        let original_status = group.status;
        let original_snapshot = member_snapshot(&group);

        assert_susu_error(apply_accept_invite(&mut group, invitee), expected_error);
        assert_eq!(group.status, original_status);
        assert_eq!(member_snapshot(&group), original_snapshot);
    }
}

#[test]
fn test_accept_invite_member_pays_rent() {
    assert!(ACCEPT_INVITE_SOURCE.contains("member: Signer<'info>"));
    assert!(ACCEPT_INVITE_SOURCE.contains("#[account(mut)]"));
    assert!(ACCEPT_INVITE_SOURCE.contains("payer = member"));
    assert!(ACCEPT_INVITE_SOURCE.contains("space = 8 + MemberPosition::INIT_SPACE"));
    assert!(ACCEPT_INVITE_SOURCE.contains("system_program: Program<'info, System>"));
    assert!(!ACCEPT_INVITE_SOURCE.contains("payer = creator"));
}

#[test]
fn test_accept_invite_no_activation_or_token_side_effects() {
    let invitee = Pubkey::new_unique();
    let mut group = group_fixture(3, GroupStatus::Forming, vec![member_slot(invitee, false)]);
    let starting_status = group.status;

    apply_accept_invite(&mut group, invitee).expect("accept keeps group forming");

    assert_eq!(group.status, starting_status);
    assert!(matches!(group.status, GroupStatus::Forming));
    assert!(!ACCEPT_INVITE_SOURCE.contains("GroupStatus::Active"));
    assert!(!ACCEPT_INVITE_SOURCE
        .replace(' ', "")
        .contains("group.status="));

    let lower = ACCEPT_INVITE_SOURCE.to_lowercase();
    for forbidden in FORBIDDEN_ACCEPT_INVITE_SIDE_EFFECT_TERMS {
        assert!(
            !lower.contains(forbidden),
            "accept_invite must not introduce {forbidden} behavior"
        );
    }
}
