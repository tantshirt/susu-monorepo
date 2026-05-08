use std::error::Error;
use std::path::PathBuf;
use std::process::ExitCode;

use clap::Parser;
use rand_chacha::rand_core::SeedableRng;
use rand_chacha::ChaCha20Rng;
use susu_adversary::report;
use susu_adversary::simulator::{run_simulation, SimulationConfig};

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

    let config = SimulationConfig {
        circles: args.circles,
        commit_sha: args.seed.clone(),
        seed: args.seed,
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
    if !seed.is_ascii() {
        return Err("seed must contain only ASCII hexadecimal characters".to_string());
    }

    if seed.len() != 40 && seed.len() != 64 {
        return Err("seed must be exactly 40 or 64 hexadecimal characters".to_string());
    }

    if seed.len() == 40 {
        validate_hex(seed)?;
        return Ok(solana_sdk::hash::hash(seed.as_bytes()).to_bytes());
    }

    parse_64_hex_seed(seed)
}

fn validate_hex(seed: &str) -> Result<(), String> {
    for chunk in seed.as_bytes().chunks_exact(2) {
        let pair = std::str::from_utf8(chunk)
            .map_err(|_| "seed must contain only ASCII hexadecimal characters".to_string())?;
        let _ = u8::from_str_radix(pair, 16)
            .map_err(|_| "seed must contain only hexadecimal characters".to_string())?;
    }

    Ok(())
}

fn parse_64_hex_seed(seed: &str) -> Result<[u8; 32], String> {
    let mut bytes = [0_u8; 32];
    for (index, chunk) in seed.as_bytes().chunks_exact(2).enumerate() {
        let pair = std::str::from_utf8(chunk)
            .map_err(|_| "seed must contain only ASCII hexadecimal characters".to_string())?;
        bytes[index] = u8::from_str_radix(pair, 16)
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
    fn parse_seed_bytes_accepts_40_hex_commit_sha() {
        let seed = "205fe882bdb66d3f484f8e8fa4e36507e6f46483";
        let parsed = parse_seed_bytes(seed).unwrap();

        assert_eq!(parsed, solana_sdk::hash::hash(seed.as_bytes()).to_bytes());
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

    #[test]
    fn parse_seed_bytes_rejects_multibyte_without_panicking() {
        let seed = format!("{}{}0", "0".repeat(61), "é");
        assert_eq!(seed.len(), 64);
        assert!(parse_seed_bytes(&seed).is_err());
    }
}
