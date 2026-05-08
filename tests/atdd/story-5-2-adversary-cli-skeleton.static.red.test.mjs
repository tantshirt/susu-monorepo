import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const cratePath = 'crates/susu-adversary';
const cargoPath = `${cratePath}/Cargo.toml`;
const readmePath = `${cratePath}/README.md`;
const buildPath = `${cratePath}/build.rs`;
const mainPath = `${cratePath}/src/main.rs`;
const simulatorPath = `${cratePath}/src/simulator.rs`;
const reportPath = `${cratePath}/src/report.rs`;
const scenariosPath = `${cratePath}/src/scenarios/mod.rs`;
const smokeTestPath = `${cratePath}/tests/cli_smoke.rs`;

function read(path) {
  return readFileSync(path, 'utf8');
}

function compact(source) {
  return source.replace(/\s+/g, '');
}

test('Story 5.2 scaffolds the adversary CLI crate and documented source layout', () => {
  for (const path of [
    cargoPath,
    readmePath,
    buildPath,
    mainPath,
    simulatorPath,
    reportPath,
    scenariosPath,
    smokeTestPath,
  ]) {
    assert.ok(existsSync(path), `${path} must exist`);
  }

  const cargo = read(cargoPath);
  assert.match(cargo, /name\s*=\s*"susu-adversary"/, 'crate must be named susu-adversary');
  assert.match(cargo, /\[\[bin\]\][\s\S]*name\s*=\s*"susu-adversary"/, 'binary name must be susu-adversary');
  assert.match(cargo, /clap\s*=\s*\{[^}]*derive/, 'clap derive dependency is required');
  assert.match(cargo, /rand_chacha/, 'deterministic ChaCha RNG dependency is required');
  assert.match(cargo, /serde_json/, 'JSON report dependency is required');
  assert.match(cargo, /solana-sdk|susu-client|susu\s*=/, 'crate must depend on program or Solana-facing SDK types');
});

test('Story 5.2 CLI parses circles, seed, cluster, and output flags with safe defaults', () => {
  const source = read(mainPath);
  const squashed = compact(source);

  assert.match(source, /derive\([^)]*Parser[^)]*\)/, 'CLI args must use clap Parser derive');
  assert.match(source, /circles:\s*u32/, '--circles must parse as u32');
  assert.match(source, /default_value_t\s*=\s*10_000/, '--circles default must be 10_000');
  assert.match(source, /seed:\s*String/, '--seed must be a string arg before validation');
  assert.match(source, /cluster:\s*String/, '--cluster must be accepted');
  assert.match(source, /default_value\s*=\s*"localnet"/, '--cluster default must be localnet');
  assert.match(source, /output/, 'CLI must expose an output path for smoke tests without polluting canonical report');
  assert.match(squashed, /Args::parse\(\)/, 'main must parse CLI args through clap');
});

test('Story 5.2 validates a 32-byte hex seed and constructs ChaCha20Rng exactly once', () => {
  const combined = [mainPath, simulatorPath].map(read).join('\n');

  assert.match(combined, /fn\s+parse_seed_bytes\b/, 'seed parsing helper must be testable');
  assert.match(combined, /seed\.len\(\)\s*!=\s*64|64\s*!=\s*seed\.len\(\)/, 'seed length must be exactly 64 hex chars');
  assert.match(combined, /from_str_radix\([^,]+,\s*16\)/, 'seed parser must reject non-hex input');
  assert.match(combined, /ChaCha20Rng::from_seed\(/, 'RNG must be constructed from decoded seed bytes');
  assert.match(combined, /&mut\s+ChaCha20Rng/, 'randomized helpers must receive a mutable seeded RNG');
  assert.doesNotMatch(combined, /thread_rng|OsRng|from_entropy|StdRng|SmallRng|getrandom|random\(/, 'unseeded randomness is forbidden');
});

test('Story 5.2 report schema contains deterministic metadata, summary, and scenario results', () => {
  const source = read(reportPath);

  for (const required of [
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
  ]) {
    assert.match(source, required, `report.rs must include ${required}`);
  }

  assert.match(source, /to_writer_pretty/, 'report writer must use stable pretty JSON');
  assert.match(source, /write_all\(b"\\n"\)/, 'report writer must add a trailing newline');
  assert.doesNotMatch(source, /HashMap|SystemTime::now|Utc::now|Local::now|hostname|process::id|thread::current|f32|f64/, 'report output must avoid nondeterministic fields and floats');
});

test('Story 5.2 simulator skeleton records stable localnet scenario coverage', () => {
  const source = read(simulatorPath);

  assert.match(source, /SimulationConfig/, 'simulator must expose a config struct');
  assert.match(source, /cluster:\s*String/, 'simulator config must carry cluster');
  assert.match(source, /localnet/, 'skeleton must explicitly support localnet');
  assert.match(source, /sample_lifecycle\b/, 'simulator must have a randomized lifecycle helper');
  assert.match(source, /gen_range\(3\.\.=12\)/, 'lifecycle sampling must cover n in [3, 12]');
  assert.match(source, /gen_range\(10_000_000\.\.=10_000_000_000\)/, 'contribution sampling must cover $10-$10K in 6-decimal base units');
  assert.match(source, /scenario_skeleton|skeleton/i, 'Story 5.2 should name skeleton scenario coverage before Story 5.3');
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
  assert.match(smoke, /"0"\.repeat\(64\)|0000000000000000000000000000000000000000000000000000000000000000/, 'smoke test must use a fixed 32-byte zero seed');
  assert.match(smoke, /serde_json::from_str|serde_json::from_slice/, 'smoke test must parse the output JSON');
  assert.match(smoke, /status\.success\(\)/, 'known-good skeleton smoke must exit 0');
});
