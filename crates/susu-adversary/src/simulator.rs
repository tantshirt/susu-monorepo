use rand::Rng;
use rand_chacha::ChaCha20Rng;

use crate::report::{AdversaryReport, PerScenarioResult, RunMetadata, Summary};
use crate::scenarios;

#[derive(Debug, Clone)]
pub struct SimulationConfig {
    pub circles: u32,
    pub seed: String,
    pub commit_sha: String,
    pub cluster: String,
}

#[derive(Debug, Clone)]
struct LifecycleSample {
    group_size: u8,
    contribution_lamports: u64,
    defection_pattern: &'static str,
}

pub fn run_simulation(
    config: SimulationConfig,
    rng: &mut ChaCha20Rng,
) -> Result<AdversaryReport, String> {
    let _sdk_boundary_marker = sdk_boundary_marker();

    if config.cluster != "localnet" {
        return Err(format!(
            "unsupported cluster {}; Story 5.2 skeleton supports localnet",
            config.cluster
        ));
    }

    let mut min_group_size = u8::MAX;
    let mut max_group_size = 0_u8;
    let mut max_contribution_lamports = 0_u64;
    let mut max_defector_profit_lamports = 0_i64;

    for _ in 0..config.circles {
        let sample = sample_lifecycle(rng);
        min_group_size = min_group_size.min(sample.group_size);
        max_group_size = max_group_size.max(sample.group_size);
        max_contribution_lamports = max_contribution_lamports.max(sample.contribution_lamports);
        max_defector_profit_lamports =
            max_defector_profit_lamports.max(evaluate_skeleton_profit(&sample));
    }

    if config.circles == 0 {
        min_group_size = 0;
    }

    let scenario_name = scenarios::SCENARIO_SKELETON.to_string();
    let scenario = PerScenarioResult {
        name: scenario_name.clone(),
        runs: config.circles,
        max_defector_profit_lamports,
        min_group_size,
        max_group_size,
        max_contribution_lamports,
        counterexample: "none".to_string(),
    };

    Ok(AdversaryReport {
        run_metadata: RunMetadata {
            seed: config.seed,
            commit_sha: config.commit_sha,
            circles: config.circles,
            started_at: deterministic_marker("started", config.circles),
            finished_at: deterministic_marker("finished", config.circles),
            cluster: config.cluster,
        },
        summary: Summary {
            total_runs: config.circles,
            max_defector_profit_lamports,
            scenarios_covered: vec![scenario_name],
        },
        per_scenario_results: vec![scenario],
    })
}

fn sample_lifecycle(rng: &mut ChaCha20Rng) -> LifecycleSample {
    const PATTERNS: [&str; 3] = ["none", "single_default", "cartel_placeholder"];

    LifecycleSample {
        group_size: rng.gen_range(3..=12),
        contribution_lamports: rng.gen_range(10_000_000..=10_000_000_000),
        defection_pattern: PATTERNS[rng.gen_range(0..PATTERNS.len())],
    }
}

fn evaluate_skeleton_profit(sample: &LifecycleSample) -> i64 {
    match sample.defection_pattern {
        "none" | "single_default" | "cartel_placeholder" => 0,
        _ => 0,
    }
}

fn deterministic_marker(label: &str, circles: u32) -> String {
    format!("{label}-deterministic-circles-{circles}")
}

fn sdk_boundary_marker() -> usize {
    std::mem::size_of::<solana_sdk::pubkey::Pubkey>() + std::mem::size_of::<susu_client::Group>()
}

#[cfg(test)]
mod tests {
    use rand_chacha::rand_core::SeedableRng;
    use rand_chacha::ChaCha20Rng;

    use super::{run_simulation, SimulationConfig};

    #[test]
    fn run_simulation_is_stable_for_same_seed() {
        let config = SimulationConfig {
            circles: 10,
            seed: "0".repeat(64),
            commit_sha: "test-commit".to_string(),
            cluster: "localnet".to_string(),
        };
        let mut first_rng = ChaCha20Rng::from_seed([0_u8; 32]);
        let mut second_rng = ChaCha20Rng::from_seed([0_u8; 32]);

        let first = run_simulation(config.clone(), &mut first_rng).unwrap();
        let second = run_simulation(config, &mut second_rng).unwrap();

        assert_eq!(
            serde_json::to_string(&first).unwrap(),
            serde_json::to_string(&second).unwrap()
        );
    }
}
