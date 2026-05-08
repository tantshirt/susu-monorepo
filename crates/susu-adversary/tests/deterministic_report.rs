use std::fs::read;
use std::path::PathBuf;
use std::process::Command;

const COMMIT_SHA_SEED: &str = "205fe882bdb66d3f484f8e8fa4e36507e6f46483";

#[test]
fn same_commit_seed_produces_identical_report_bytes() {
    let output_dir = option_env!("CARGO_TARGET_TMPDIR")
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir);
    let first_path = output_dir.join("susu-adversary-deterministic-first.json");
    let second_path = output_dir.join("susu-adversary-deterministic-second.json");
    let _ = std::fs::remove_file(&first_path);
    let _ = std::fs::remove_file(&second_path);

    run_adversary_report(&first_path);
    run_adversary_report(&second_path);

    let first_report = read(&first_path).expect("first report should be readable");
    let second_report = read(&second_path).expect("second report should be readable");

    assert_eq!(first_report, second_report);
    assert!(first_report.ends_with(b"\n"));

    let parsed: serde_json::Value =
        serde_json::from_slice(&first_report).expect("deterministic report should parse");
    assert_eq!(parsed["run_metadata"]["seed"], COMMIT_SHA_SEED);
    assert_eq!(parsed["run_metadata"]["commit_sha"], COMMIT_SHA_SEED);
    assert_eq!(parsed["summary"]["max_defector_profit_lamports"], 0);
    assert!(parsed["summary"]["scenarios_covered"]
        .as_array()
        .expect("scenarios_covered should be an array")
        .iter()
        .any(|value| value == "30_percent_cartel"));

    let _ = std::fs::remove_file(&first_path);
    let _ = std::fs::remove_file(&second_path);
}

fn run_adversary_report(output_path: &std::path::Path) {
    // --seed 205fe882bdb66d3f484f8e8fa4e36507e6f46483 exercises commit-style input.
    let status = Command::new(env!("CARGO_BIN_EXE_susu-adversary"))
        .args([
            "--circles",
            "100",
            "--seed",
            COMMIT_SHA_SEED,
            "--cluster",
            "localnet",
            "--output",
        ])
        .arg(output_path)
        .status()
        .expect("susu-adversary binary should run");

    assert!(
        status.success(),
        "deterministic adversary run should exit 0"
    );
}
