use std::fs::{create_dir_all, File};
use std::io::Write;
use std::path::Path;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdversaryReport {
    pub run_metadata: RunMetadata,
    pub summary: Summary,
    pub per_scenario_results: Vec<PerScenarioResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunMetadata {
    pub seed: String,
    pub commit_sha: String,
    pub circles: u32,
    pub started_at: String,
    pub finished_at: String,
    pub cluster: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Summary {
    pub total_runs: u32,
    pub max_defector_profit_lamports: i64,
    pub scenarios_covered: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerScenarioResult {
    pub name: String,
    pub runs: u32,
    pub max_defector_profit_lamports: i64,
    pub min_group_size: u8,
    pub max_group_size: u8,
    pub max_contribution_lamports: u64,
    pub counterexample: String,
}

impl AdversaryReport {
    pub fn worst_scenario(&self) -> Option<&PerScenarioResult> {
        self.per_scenario_results
            .iter()
            .max_by_key(|scenario| scenario.max_defector_profit_lamports)
    }
}

pub fn write_report(path: &Path, report: &AdversaryReport) -> Result<(), std::io::Error> {
    if let Some(parent) = path.parent() {
        create_dir_all(parent)?;
    }

    let mut file = File::create(path)?;
    serde_json::to_writer_pretty(&mut file, report)?;
    file.write_all(b"\n")?;
    Ok(())
}
