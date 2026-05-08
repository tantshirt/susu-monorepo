use std::panic::{catch_unwind, AssertUnwindSafe};

use rand_chacha::rand_core::SeedableRng;
use rand_chacha::ChaCha20Rng;
use susu_adversary::scenarios::thirty_percent_cartel::{
    assert_defectors_net_negative, assert_honest_members_made_whole, assert_no_admin_intervention,
    build_setup, run,
};
use susu_adversary::scenarios::{MemberRole, SimulatorContext, THIRTY_PERCENT_CARTEL};

#[test]
fn setup_reaches_rotation_3_before_the_cartel_defaults() {
    // Story 5.3 scenario-specific check; run with `cargo test --package susu-adversary`.
    let mut rng = ChaCha20Rng::from_seed([3_u8; 32]);
    let mut ctx = SimulatorContext::new(53);

    let setup = build_setup(&mut rng, &mut ctx);

    assert_eq!(setup.member_count, 10);
    assert_eq!(setup.contribution_lamports, 100_000_000);
    assert_eq!(setup.funded_rotations, vec![0, 1, 2, 3]);
    assert_eq!(setup.claimant_member, 3);
    assert_eq!(setup.default_rotation, 4);
    assert_eq!(setup.defector_members, vec![4, 5, 6]);
    assert_eq!(setup.honest_members, vec![0, 1, 2, 3, 7, 8, 9]);
    assert!(
        ctx.event_log
            .iter()
            .any(|event| event.contains("funded rotation 3")),
        "setup must record contribution progress through rotation 3"
    );
}

#[test]
fn run_makes_honest_members_whole_and_defectors_negative() {
    let mut rng = ChaCha20Rng::from_seed([4_u8; 32]);
    let mut ctx = SimulatorContext::new(1);

    let result = run(&mut rng, &mut ctx);

    assert_eq!(result.name, THIRTY_PERCENT_CARTEL);
    assert_honest_members_made_whole(&result);
    assert_defectors_net_negative(&result);
    assert_no_admin_intervention(&result);
    assert_eq!(
        result.defector_net_pnl_lamports,
        vec![-400_000_000, -400_000_000, -400_000_000]
    );
    assert!(result
        .ledgers
        .iter()
        .filter(|ledger| ledger.role == MemberRole::Defector)
        .all(|ledger| ledger.net_pnl_lamports() < 0));
}

#[test]
fn defector_profit_sanity_check_fails_the_assertion() {
    let mut rng = ChaCha20Rng::from_seed([5_u8; 32]);
    let mut ctx = SimulatorContext::new(2);
    let mut result = run(&mut rng, &mut ctx);

    let defector = result
        .ledgers
        .iter_mut()
        .find(|ledger| ledger.member_index == 4)
        .expect("member 4 should be a defector");
    defector.payout_received_lamports = defector.collateral_seized_lamports + 1;

    let panic = catch_unwind(AssertUnwindSafe(|| {
        assert_defectors_net_negative(&result);
    }));

    assert!(
        panic.is_err(),
        "synthetic defector profit must fail assertions"
    );
}
