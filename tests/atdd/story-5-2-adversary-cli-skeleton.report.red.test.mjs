import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const cratePath = 'crates/susu-adversary';
const readmePath = `${cratePath}/README.md`;
const reportPath = `${cratePath}/src/report.rs`;
const smokeTestPath = `${cratePath}/tests/cli_smoke.rs`;

function read(path) {
  return readFileSync(path, 'utf8');
}

test('Story 5.2 report schema contains deterministic metadata, summary, and scenario results', () => {
  const source = read(reportPath);
  const requiredPatterns = [
    /RunMetadata/,
    /Summary/,
    /PerScenarioResult/,
    /AdversaryReport/,
    /seed:\s*String/,
    /commit_sha:\s*String/,
    /circles:\s*u32/,
    /started_at:\s*String/,
    /finished_at:\s*String/,
    /total_runs:\s*u32/,
    /max_defector_profit_lamports:\s*i64/,
    /scenarios_covered:\s*Vec<String>/,
    /per_scenario_results:\s*Vec<PerScenarioResult>/,
  ];

  for (const required of requiredPatterns) {
    assert.match(source, required, `report.rs must include ${required}`);
  }

  assert.match(source, /to_writer_pretty/, 'report writer must use stable pretty JSON');
  assert.match(source, /write_all\(b"\\n"\)/, 'report writer must add a trailing newline');
  assert.doesNotMatch(source, /HashMap|SystemTime::now|Utc::now|Local::now|hostname|process::id|thread::current|f32|f64/, 'report output must avoid nondeterministic fields and floats');
});

test('Story 5.2 README and smoke test document reproducible CLI usage', () => {
  const readme = read(readmePath);
  const smoke = read(smokeTestPath);

  assert.match(readme, /--seed\s+\$COMMIT_SHA/, 'README must document commit-SHA seed convention');
  assert.match(readme, /audits\/adversary\/adversary-report\.json/, 'README must name canonical report path');
  assert.match(readme, /run_metadata/i, 'README must explain run_metadata');
  assert.match(readme, /summary/i, 'README must explain summary');
  assert.match(readme, /per_scenario_results/i, 'README must explain per_scenario_results');
  assert.match(readme, /Story 5\.4|byte-deterministic/i, 'README must defer canonical byte determinism to Story 5.4');
  assert.match(smoke, /Command::new/, 'smoke test must shell out to the binary');
  assert.match(smoke, /--circles[\s\S]*10/, 'smoke test must use a small 10-circle run');
  assert.match(smoke, /"0"\.repeat\(64\)|0000000000000000000000000000000000000000000000000000000000000000/, 'smoke test must use a fixed seed');
  assert.match(smoke, /serde_json::from_str|serde_json::from_slice/, 'smoke test must parse the output JSON');
  assert.match(smoke, /status\.success\(\)/, 'known-good skeleton smoke must exit 0');
});
