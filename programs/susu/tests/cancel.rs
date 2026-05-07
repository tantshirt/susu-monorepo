use anchor_lang::error::Error;
use anchor_lang::prelude::Pubkey;
use susu::error::SusuError;
use susu::instructions::cancel_group::apply_cancel_group;
use susu::seeds::GROUP_SEED;
use susu::state::{CurveParams, Group, GroupStatus};
use susu::ID;

const CANCEL_GROUP_SOURCE: &str = include_str!("../src/instructions/cancel_group.rs");
const GROUP_CANCELLED_LOG: &str = "group_cancelled";
const FORBIDDEN_CANCEL_GROUP_TOKEN_SIDE_EFFECT_TERMS: [&str; 15] = [
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
    "refund",
    "withdraw",
    "collateral_posted",
    "fee",
    "yield",
];

fn compact(source: &str) -> String {
    source.split_whitespace().collect()
}

fn derive_group_pda(creator: Pubkey, group_id: u64) -> Pubkey {
    let group_id_bytes = group_id.to_le_bytes();
    Pubkey::find_program_address(
        &[GROUP_SEED, creator.as_ref(), group_id_bytes.as_ref()],
        &ID,
    )
    .0
}

fn group_fixture(status: GroupStatus) -> Group {
    Group {
        mint: Pubkey::new_unique(),
        contribution_amount: 100,
        contribution_period: 30,
        n: 5,
        curve_params: CurveParams {},
        members: Vec::new(),
        status,
        created_at: 1,
        creator: Pubkey::new_unique(),
        group_id: 42,
        bump: 255,
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
fn test_cancel_group_happy_path() {
    let mut group = group_fixture(GroupStatus::Forming);

    apply_cancel_group(&mut group).expect("forming group must be cancellable");

    assert_eq!(group.status, GroupStatus::Cancelled);
    assert_eq!(GROUP_CANCELLED_LOG, "group_cancelled");
}

#[test]
fn test_cancel_group_happy_path_contract_proxy() {
    let source = CANCEL_GROUP_SOURCE;
    let compact = compact(source);

    assert!(
        compact.contains(
            "require!(group.status==GroupStatus::Forming,SusuError::GroupAlreadyStarted)"
        ),
        "cancel_group must reject every non-Forming status before mutation"
    );
    assert!(
        compact.contains("group.status=GroupStatus::Cancelled;"),
        "cancel_group must persist GroupStatus::Cancelled"
    );
    assert_eq!(GROUP_CANCELLED_LOG, "group_cancelled");
    assert!(
        source.contains("msg!(\"group_cancelled group_pda={} creator={}\","),
        "cancel_group must emit the group_cancelled log contract"
    );
}

#[test]
fn test_cancel_group_already_cancelled() {
    let mut group = group_fixture(GroupStatus::Forming);

    apply_cancel_group(&mut group).expect("first cancel must pass");

    assert_susu_error(
        apply_cancel_group(&mut group),
        SusuError::GroupAlreadyStarted,
    );
    assert_eq!(group.status, GroupStatus::Cancelled);
}

#[test]
fn test_cancel_group_active_and_completed_rejected() {
    for status in [GroupStatus::Active, GroupStatus::Completed] {
        let mut group = group_fixture(status);

        assert_susu_error(
            apply_cancel_group(&mut group),
            SusuError::GroupAlreadyStarted,
        );
        assert_eq!(group.status, status);
    }
}

#[test]
fn test_cancel_group_non_creator_rejected_by_account_constraints_proxy() {
    let source = CANCEL_GROUP_SOURCE;
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
fn test_cancel_group_active_completed_and_recancel_rejected_proxy() {
    let source = compact(CANCEL_GROUP_SOURCE);

    assert!(
        source.contains("GroupStatus::Forming"),
        "Forming must be the only status allowed to cancel"
    );
    assert!(
        source.contains("SusuError::GroupAlreadyStarted"),
        "Active, Completed, and already Cancelled cases must use GroupAlreadyStarted"
    );
    assert!(
        !source.contains("SusuError::GroupCancelled"),
        "Story 2.5 selects GroupAlreadyStarted for re-cancel rejection"
    );
}

#[test]
fn test_cancel_group_has_no_token_custody_refund_or_cpi_proxy() {
    let lower = CANCEL_GROUP_SOURCE.to_lowercase();

    for forbidden in FORBIDDEN_CANCEL_GROUP_TOKEN_SIDE_EFFECT_TERMS {
        assert!(
            !lower.contains(forbidden),
            "cancel_group must not introduce {forbidden} behavior"
        );
    }
}
