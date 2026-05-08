use std::fs::read_to_string;
use std::path::PathBuf;
use std::process::Command;

#[test]
fn cli_smoke_writes_parseable_report_and_exits_zero() {
    let output_dir = option_env!("CARGO_TARGET_TMPDIR")
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir);
    let output_path = output_dir.join("susu-adversary-smoke-report.json");
    let _ = std::fs::remove_file(&output_path);

    let status = Command::new(env!("CARGO_BIN_EXE_susu-adversary"))
        .args([
            "--circles",
            "10",
            "--seed",
            &"0".repeat(64),
            "--cluster",
            "localnet",
            "--output",
        ])
        .arg(&output_path)
        .status()
        .expect("susu-adversary binary should run");

    assert!(status.success(), "known-good skeleton smoke should exit 0");

    let report = read_to_string(&output_path).expect("report should be written");
    assert!(
        report.ends_with('\n'),
        "report should include trailing newline"
    );

    let parsed: serde_json::Value =
        serde_json::from_str(&report).expect("report should parse as JSON");
    assert_eq!(parsed["run_metadata"]["seed"], "0".repeat(64));
    assert_eq!(parsed["run_metadata"]["circles"], 10);
    assert_eq!(parsed["summary"]["total_runs"], 10);
    assert_eq!(parsed["summary"]["max_defector_profit_lamports"], 0);
    assert!(parsed["per_scenario_results"].is_array());

    let _ = std::fs::remove_file(&output_path);
}
