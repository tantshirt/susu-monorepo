import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const cratePath = 'crates/susu-adversary';
const mainPath = `${cratePath}/src/main.rs`;
const simulatorPath = `${cratePath}/src/simulator.rs`;
const reportPath = `${cratePath}/src/report.rs`;
const readmePath = `${cratePath}/README.md`;
const deterministicTestPath = `${cratePath}/tests/deterministic_report.rs`;
const auditReadmePath = 'audits/adversary/README.md';
const canonicalReportPath = 'audits/adversary/adversary-report.json';
const ciPath = '.github/workflows/ci.yml';
const scriptPath = 'scripts/check-adversary-determinism.sh';

function read(path) {
  return readFileSync(path, 'utf8');
}

function compact(source) {
  return source.replace(/\s+/g, '');
}

test('Story 5.4 accepts COMMIT_SHA seeds and keeps report metadata input-derived', () => {
  const main = read(mainPath);
  const squashed = compact(main);

  assert.match(main, /fn\s+parse_seed_bytes\b/, 'seed parsing helper must remain explicit and testable');
  assert.match(main, /seed\.len\(\)\s*!=\s*64/, '64-hex seed compatibility from Story 5.2 must remain');
  assert.match(main, /seed\.len\(\)\s*!=\s*40|40\s*!=\s*seed\.len\(\)/, 'Git SHA-1 style $COMMIT_SHA seeds must be accepted');
  assert.match(main, /solana_sdk::hash::hash|Sha256|sha2/i, '40-character commit seeds must be deterministically expanded to 32 bytes');
  assert.match(squashed, /commit_sha:args\.seed\.clone\(\)|commit_sha=args\.seed\.clone\(\)/, 'report commit_sha must come from explicit --seed input');
  assert.doesNotMatch(main, /env!\(|std::env::var|var_os|current_dir|hostname|process::id|thread::current/, 'report metadata must not use ambient runtime/build environment values');
});

test('Story 5.4 sorts report arrays and writes canonical pretty JSON bytes', () => {
  const simulator = read(simulatorPath);
  const report = read(reportPath);
  const combined = `${simulator}\n${report}`;

  assert.match(simulator, /scenarios_covered\.sort\(\)|sort_by\([^)]*scenarios_covered|sort_unstable\(\)/, 'scenarios_covered must be sorted before serialization');
  assert.match(simulator, /per_scenario_results\.sort_by\(|sort_by_key\(/, 'per_scenario_results must be sorted by a stable key');
  assert.match(report, /to_writer_pretty|to_string_pretty/, 'report writer must use stable pretty JSON formatting');
  assert.match(report, /write_all\(b"\\n"\)|push\(b?'\\n'\)/, 'report writer must add a trailing newline');
  assert.doesNotMatch(combined, /HashMap|BTreeMap<[^>]+RandomState|SystemTime::now|Utc::now|Local::now|thread_rng|OsRng|from_entropy|getrandom|hostname|process::id|thread::current|f32|f64/, 'report-affecting code must avoid nondeterministic sources and floats');
});

test('Story 5.4 has an executable byte-determinism regression test', () => {
  assert.ok(existsSync(deterministicTestPath), `${deterministicTestPath} must exist`);

  const source = read(deterministicTestPath);
  assert.match(source, /CARGO_BIN_EXE_susu-adversary/, 'test must shell out to the real binary');
  assert.match(source, /--seed[\s\S]*[a-f0-9]{40}/i, 'test must exercise a 40-character commit-style seed');
  assert.match(source, /read\(|read_to_string|read_to_end/, 'test must compare emitted report bytes from disk');
  assert.match(source, /assert_eq!\([^;]*(first|left)[^;]*(second|right)|assert_eq!\([^;]*first_report[^;]*second_report/s, 'test must assert byte equality across two runs');
  assert.match(source, /ends_with\(b?"\\n"\)|ends_with\(&\[b?'\\n'\]\)/, 'test must assert the trailing newline contract');
  assert.match(source, /max_defector_profit_lamports/, 'test must assert the no-profitable-defector report result');
});

test('Story 5.4 commits canonical report docs and artifact path', () => {
  for (const path of [auditReadmePath, canonicalReportPath]) {
    assert.ok(existsSync(path), `${path} must exist`);
  }

  const auditReadme = read(auditReadmePath);
  const crateReadme = read(readmePath);
  const report = JSON.parse(read(canonicalReportPath));

  assert.match(auditReadme, /cargo run --bin susu-adversary --release -- --circles 10000 --seed \$COMMIT_SHA/, 'audit README must include the exact release reproduction command');
  assert.match(auditReadme, /audits\/adversary\/adversary-report\.json/, 'audit README must name the canonical report path');
  assert.match(auditReadme, /byte[- ]deterministic/i, 'audit README must explain byte determinism');
  assert.match(crateReadme, /40-character|Git SHA-1|\$COMMIT_SHA/, 'crate README must explain commit SHA seed support');
  assert.equal(report.summary.max_defector_profit_lamports, 0, 'canonical report must have no profitable defector');
  assert.ok(report.summary.scenarios_covered.includes('30_percent_cartel'), 'canonical report must include the named 30% Cartel scenario');
});

test('Story 5.4 wires determinism guard into CI with a bounded 10K run', () => {
  for (const path of [scriptPath, ciPath]) {
    assert.ok(existsSync(path), `${path} must exist`);
  }

  const script = read(scriptPath);
  const ci = read(ciPath);

  assert.match(script, /--circles\s+"\$\{?CIRCLES|--circles\s+10000|CIRCLES:-10000/, 'determinism script must default to a 10,000-circle run');
  assert.match(script, /cmp\s+-s|diff\s+-u|shasum|sha256sum/, 'determinism script must compare report bytes across two runs');
  assert.match(script, /timeout|TIMEOUT_SECONDS|600/, 'determinism script must document or enforce a 10-minute budget');
  assert.match(script, /max_defector_profit_lamports/, 'determinism script must validate the no-profitable-defector summary');
  assert.match(ci, /check-adversary-determinism\.sh/, 'CI must invoke the determinism guard script');
});

