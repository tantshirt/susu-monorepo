use rand_chacha::ChaCha20Rng;

pub mod thirty_percent_cartel;

pub const SCENARIO_SKELETON: &str = "scenario_skeleton";
pub const THIRTY_PERCENT_CARTEL: &str = "30_percent_cartel";

#[derive(Debug, Clone, Copy)]
pub struct Scenario {
    pub name: &'static str,
    pub run: fn(&mut ChaCha20Rng, &mut SimulatorContext) -> ScenarioResult,
}

#[derive(Debug, Clone, Default)]
pub struct SimulatorContext {
    pub run_index: u32,
    pub event_log: Vec<String>,
}

impl SimulatorContext {
    pub fn new(run_index: u32) -> Self {
        Self {
            run_index,
            event_log: Vec::new(),
        }
    }

    pub fn record(&mut self, event: impl Into<String>) {
        self.event_log.push(event.into());
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MemberRole {
    Honest,
    Defector,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MemberLedger {
    pub member_index: u8,
    pub role: MemberRole,
    pub contributions_paid_lamports: u64,
    pub payout_received_lamports: u64,
    pub collateral_seized_lamports: u64,
    pub recovery_received_lamports: u64,
}

impl MemberLedger {
    pub fn net_pnl_lamports(&self) -> i64 {
        self.payout_received_lamports as i64 + self.recovery_received_lamports as i64
            - self.contributions_paid_lamports as i64
            - self.collateral_seized_lamports as i64
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ScenarioResult {
    pub name: &'static str,
    pub member_count: u8,
    pub contribution_lamports: u64,
    pub funded_rotations: Vec<u8>,
    pub claimant_member: u8,
    pub default_rotation: u8,
    pub defector_members: Vec<u8>,
    pub ledgers: Vec<MemberLedger>,
    pub admin_intervention_count: u32,
    pub max_defector_profit_lamports: i64,
    pub defector_net_pnl_lamports: Vec<i64>,
    pub counterexample: String,
}

pub fn all_scenarios() -> Vec<Scenario> {
    vec![Scenario {
        name: THIRTY_PERCENT_CARTEL,
        run: thirty_percent_cartel::run,
    }]
}
