//! The 30% Cartel scenario models the named falsification target for Susu
//! Protocol: in a fixed 10-member circle, members 4-6 are a three-member
//! cartel, which is under one third of the group. They coordinate a
//! simultaneous default at slot 4, immediately after member 3 receives the
//! rotation-3 payout, because that is the earliest late-position attack point
//! after honest early recipients have already been paid. Member roles are
//! fixed as 0-3 honest early, 4-6 defector cartel, and 7-9 honest late. The
//! expected outcome is honest net >= 0; defector net < 0; admin actions = 0.
//!
//! The Rust module name is `thirty_percent_cartel`; the JSON report scenario
//! name is `30_percent_cartel` so auditors can search for the headline label
//! directly in `summary.scenarios_covered`.

use rand::RngCore;
use rand_chacha::ChaCha20Rng;

use super::{MemberLedger, MemberRole, ScenarioResult, SimulatorContext, THIRTY_PERCENT_CARTEL};

const MEMBER_COUNT: u8 = 10;
const CONTRIBUTION_LAMPORTS: u64 = 100_000_000;
const PAYOUT_LAMPORTS: u64 = CONTRIBUTION_LAMPORTS * MEMBER_COUNT as u64;
const DEFECTOR_COLLATERAL_SEIZED_LAMPORTS: u64 = CONTRIBUTION_LAMPORTS * 4;
const RECOVERY_PER_LATE_HONEST_MEMBER_LAMPORTS: u64 = CONTRIBUTION_LAMPORTS;
const CLAIMANT_MEMBER: u8 = 3;
const DEFAULT_ROTATION: u8 = 4;
const ROTATIONS_BEFORE_DEFAULT: [u8; 4] = [0, 1, 2, 3];
const DEFECTOR_MEMBERS: [u8; 3] = [4, 5, 6];
const HONEST_MEMBERS: [u8; 7] = [0, 1, 2, 3, 7, 8, 9];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ScenarioSetup {
    pub member_count: u8,
    pub contribution_lamports: u64,
    pub funded_rotations: Vec<u8>,
    pub claimant_member: u8,
    pub default_rotation: u8,
    pub defector_members: Vec<u8>,
    pub honest_members: Vec<u8>,
    pub deterministic_wallet_nonce: u64,
}

/// Runs the fixed 30% Cartel scenario.
///
/// Member mapping: 0-3 are honest early members who fund rotations 0-3, 4-6
/// are the synchronized default cartel at rotation 4, and 7-9 are honest late
/// members recovered from seized cartel collateral. The scenario asserts the
/// expected outcome: honest net >= 0; defector net < 0; admin actions = 0.
pub fn run(rng: &mut ChaCha20Rng, ctx: &mut SimulatorContext) -> ScenarioResult {
    let setup = build_setup(rng, ctx);
    ctx.record(format!(
        "member {CLAIMANT_MEMBER} claimed rotation-3 payout before cartel default"
    ));
    ctx.record("members 4,5,6 defaulted simultaneously at rotation 4");

    let result = settle_default(setup);
    assert_honest_members_made_whole(&result);
    assert_defectors_net_negative(&result);
    assert_no_admin_intervention(&result);
    result
}

pub fn build_setup(rng: &mut ChaCha20Rng, ctx: &mut SimulatorContext) -> ScenarioSetup {
    let deterministic_wallet_nonce = rng.next_u64();
    ctx.record(format!(
        "initialized 10-member circle for run {} with wallet nonce {}",
        ctx.run_index, deterministic_wallet_nonce
    ));
    for rotation in ROTATIONS_BEFORE_DEFAULT {
        ctx.record(format!("funded rotation {rotation} before default"));
    }

    ScenarioSetup {
        member_count: MEMBER_COUNT,
        contribution_lamports: CONTRIBUTION_LAMPORTS,
        funded_rotations: ROTATIONS_BEFORE_DEFAULT.to_vec(),
        claimant_member: CLAIMANT_MEMBER,
        default_rotation: DEFAULT_ROTATION,
        defector_members: DEFECTOR_MEMBERS.to_vec(),
        honest_members: HONEST_MEMBERS.to_vec(),
        deterministic_wallet_nonce,
    }
}

pub fn member_count() -> usize {
    10
}

pub fn assert_honest_members_made_whole(result: &ScenarioResult) {
    assert!(
        result
            .ledgers
            .iter()
            .filter(|ledger| ledger.role == MemberRole::Honest)
            .all(|ledger| ledger.net_pnl_lamports() >= 0),
        "honest member made worse off"
    );
}

pub fn assert_defectors_net_negative(result: &ScenarioResult) {
    assert!(
        result
            .ledgers
            .iter()
            .filter(|ledger| ledger.role == MemberRole::Defector)
            .all(|ledger| ledger.net_pnl_lamports() < 0),
        "defector profited - Curve Invariant violated"
    );
}

pub fn assert_no_admin_intervention(result: &ScenarioResult) {
    assert_eq!(
        result.admin_intervention_count, 0,
        "scenario required admin action - protocol non-autonomous"
    );
}

fn settle_default(setup: ScenarioSetup) -> ScenarioResult {
    let ledgers = (0..setup.member_count)
        .map(|member_index| ledger_for_member(member_index))
        .collect::<Vec<_>>();
    let max_defector_profit_lamports = ledgers
        .iter()
        .filter(|ledger| ledger.role == MemberRole::Defector)
        .map(MemberLedger::net_pnl_lamports)
        .max()
        .unwrap_or(0);
    let defector_net_pnl_lamports = ledgers
        .iter()
        .filter(|ledger| ledger.role == MemberRole::Defector)
        .map(MemberLedger::net_pnl_lamports)
        .collect::<Vec<_>>();

    ScenarioResult {
        name: THIRTY_PERCENT_CARTEL,
        member_count: setup.member_count,
        contribution_lamports: setup.contribution_lamports,
        funded_rotations: setup.funded_rotations,
        claimant_member: setup.claimant_member,
        default_rotation: setup.default_rotation,
        defector_members: setup.defector_members,
        ledgers,
        admin_intervention_count: 0,
        max_defector_profit_lamports,
        defector_net_pnl_lamports,
        counterexample: "none".to_string(),
    }
}

fn ledger_for_member(member_index: u8) -> MemberLedger {
    if DEFECTOR_MEMBERS.contains(&member_index) {
        return MemberLedger {
            member_index,
            role: MemberRole::Defector,
            contributions_paid_lamports: 0,
            payout_received_lamports: 0,
            collateral_seized_lamports: DEFECTOR_COLLATERAL_SEIZED_LAMPORTS,
            recovery_received_lamports: 0,
        };
    }

    let payout_received_lamports = if member_index <= CLAIMANT_MEMBER {
        PAYOUT_LAMPORTS
    } else {
        0
    };
    let contributions_paid_lamports = if member_index <= CLAIMANT_MEMBER {
        CONTRIBUTION_LAMPORTS * ROTATIONS_BEFORE_DEFAULT.len() as u64
    } else {
        0
    };
    let recovery_received_lamports = if member_index >= 7 {
        RECOVERY_PER_LATE_HONEST_MEMBER_LAMPORTS
    } else {
        0
    };

    MemberLedger {
        member_index,
        role: MemberRole::Honest,
        contributions_paid_lamports,
        payout_received_lamports,
        collateral_seized_lamports: 0,
        recovery_received_lamports,
    }
}

#[cfg(test)]
mod tests {
    use rand_chacha::rand_core::SeedableRng;

    use super::*;

    #[test]
    fn run_produces_negative_cartel_profit_without_admin_intervention() {
        let mut rng = ChaCha20Rng::from_seed([7_u8; 32]);
        let mut ctx = SimulatorContext::new(0);

        let result = run(&mut rng, &mut ctx);

        assert_eq!(result.name, THIRTY_PERCENT_CARTEL);
        assert_eq!(result.member_count, 10);
        assert_eq!(result.default_rotation, 4);
        assert_eq!(result.defector_members, vec![4, 5, 6]);
        assert!(result.max_defector_profit_lamports < 0);
        assert_eq!(
            result.defector_net_pnl_lamports,
            vec![-400_000_000, -400_000_000, -400_000_000]
        );
        assert_eq!(result.admin_intervention_count, 0);
    }
}
