mod report;
mod scenarios;
mod simulator;

use std::error::Error;
use std::path::PathBuf;
use std::process::ExitCode;

use clap::Parser;
use rand_chacha::rand_core::SeedableRng;
use rand_chacha::ChaCha20Rng;
use simulator::{run_simulation, SimulationConfig};

const DEFAULT_REPORT_PATH: &str = "audits/adversary/adversary-report.json";

#[derive(Debug, Parser)]
#[command(
    name = "susu-adversary",
    about = "Run deterministic adversarial Susu Protocol lifecycle simulations"
)]
struct Args {
    #[arg(long, default_value_t = 10_000)]
    circles: u32,

    #[arg(long)]
    seed: String,

    #[arg(long, default_value = "localnet")]
    cluster: String,

    #[arg(long, default_value = DEFAULT_REPORT_PATH)]
    output: PathBuf,
}

fn main() -> ExitCode {
    match run() {
        Ok(max_defector_profit_lamports) if max_defector_profit_lamports == 0 => ExitCode::SUCCESS,
        Ok(max_defector_profit_lamports) => {
            eprintln!(
                "adversary simulation found positive defector profit: {max_defector_profit_lamports} lamports"
            );
            ExitCode::FAILURE
        }
        Err(error) => {
            eprintln!("susu-adversary error: {error}");
            ExitCode::FAILURE
        }
    }
}

fn run() -> Result<i64, Box<dyn Error>> {
    let args = Args::parse();
    let seed_bytes = parse_seed_bytes(&args.seed)?;
    let mut rng = ChaCha20Rng::from_seed(seed_bytes);
    let commit_sha = option_env!("GIT_COMMIT_SHA")
        .unwrap_or(env!("SUSU_ADVERSARY_BUILD_COMMIT"))
        .to_string();

    let config = SimulationConfig {
        circles: args.circles,
        seed: args.seed,
        commit_sha,
        cluster: args.cluster,
    };

    let report = run_simulation(config, &mut rng)?;
    let max_defector_profit_lamports = report.summary.max_defector_profit_lamports;
    report::write_report(&args.output, &report)?;

    if max_defector_profit_lamports > 0 {
        if let Some(worst) = report.worst_scenario() {
            eprintln!(
                "worst scenario: {} with max defector profit {} lamports; counterexample: {}",
                worst.name, worst.max_defector_profit_lamports, worst.counterexample
            );
        }
    }

    Ok(max_defector_profit_lamports)
}

fn parse_seed_bytes(seed: &str) -> Result<[u8; 32], String> {
    if seed.len() != 64 {
        return Err("seed must be exactly 64 hexadecimal characters".to_string());
    }

    let mut bytes = [0_u8; 32];
    for index in 0..32 {
        let start = index * 2;
        let end = start + 2;
        bytes[index] = u8::from_str_radix(&seed[start..end], 16)
            .map_err(|_| "seed must contain only hexadecimal characters".to_string())?;
    }

    Ok(bytes)
}

#[cfg(test)]
mod tests {
    use super::parse_seed_bytes;

    #[test]
    fn parse_seed_bytes_accepts_64_hex_chars() {
        assert_eq!(parse_seed_bytes(&"0".repeat(64)).unwrap(), [0_u8; 32]);
    }

    #[test]
    fn parse_seed_bytes_rejects_wrong_length() {
        assert!(parse_seed_bytes("00").is_err());
    }

    #[test]
    fn parse_seed_bytes_rejects_non_hex_input() {
        let mut seed = "0".repeat(63);
        seed.push('z');
        assert!(parse_seed_bytes(&seed).is_err());
    }
}
