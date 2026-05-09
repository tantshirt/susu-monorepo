import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const scriptPath = 'scripts/check-audit-signoff.sh';
const workflowPath = '.github/workflows/audit-signoff.yml';
const skipSentinel = 'audits/SKIP_AUDIT_GATE';
const atddDoc = 'tests/atdd/story-9-1-audit-signoff-gate.atdd.md';

test('Story 9.1: scripts/check-audit-signoff.sh exists and is executable', () => {
  assert.ok(existsSync(scriptPath), `${scriptPath} must exist`);
  const mode = statSync(scriptPath).mode;
  assert.ok((mode & 0o111) !== 0, `${scriptPath} must be executable`);
  const body = readFileSync(scriptPath, 'utf8');
  assert.match(body, /^#!.+bash/m, 'script must declare a bash shebang');
  assert.match(body, /set -euo pipefail/, 'script must use strict mode');
});

test('Story 9.1: script enforces audit invariants in non-skip mode', () => {
  const body = readFileSync(scriptPath, 'utf8');
  assert.match(body, /audits\/audit-summary\.json/, 'must check audits/audit-summary.json (per epics §9.1 AC)');
  assert.match(body, /critical/i, 'must check critical findings count');
  assert.match(body, /high/i, 'must check high findings count');
  assert.match(body, /SIGNED_OFF|signed_off/, 'must verify sign-off sentinel or field');
  assert.match(body, /audits\/.*\.pdf/, 'must verify a PDF report exists');
  assert.match(body, /findings-tracker/, 'must reference findings-tracker.md handling');
  assert.match(body, /Story 9\.2/, 'failure message must point operator at Story 9.2 mainnet deploy gate');
});

test('Story 9.1: script supports SUSU_AUDIT_GATE=skip and audits/SKIP_AUDIT_GATE sentinel', () => {
  const body = readFileSync(scriptPath, 'utf8');
  assert.match(body, /SUSU_AUDIT_GATE/, 'must consult SUSU_AUDIT_GATE env');
  assert.match(body, /SKIP_AUDIT_GATE/, 'must consult SKIP_AUDIT_GATE sentinel file');
  assert.match(body, /skipped/i, 'must print a clear "skipped (pre-audit)" message');
});

test('Story 9.1: audits/SKIP_AUDIT_GATE sentinel is committed and points at Story 9.2', () => {
  assert.ok(existsSync(skipSentinel), `${skipSentinel} must be committed pre-audit`);
  const body = readFileSync(skipSentinel, 'utf8');
  assert.match(body, /Story 9\.2/, 'sentinel must reference Story 9.2 (mainnet deploy preflight will delete this)');
});

test('Story 9.1: bash check-audit-signoff.sh exits 0 with sentinel present (current pre-audit state)', () => {
  // Sentinel is committed, so the script must succeed without arguments.
  const out = execFileSync('bash', [scriptPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  assert.match(out, /skip|skipped/i, 'must announce skip mode while sentinel is committed');
});

test('Story 9.1: bash check-audit-signoff.sh exits non-zero when forced to enforce without artifacts', () => {
  // Force enforcement even though sentinel is present, simulating Story 9.2 preflight removing the sentinel.
  let exitCode = 0;
  let captured = '';
  try {
    captured = execFileSync('bash', [scriptPath], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SUSU_AUDIT_GATE: 'enforce' },
    });
  } catch (err) {
    exitCode = err.status ?? 1;
    captured = `${err.stdout ?? ''}\n${err.stderr ?? ''}`;
  }
  assert.equal(exitCode, 1, 'must exit 1 when audit artifacts are missing in enforce mode');
  assert.match(captured, /audit|sign[- ]?off/i, 'failure output must mention audit/sign-off');
});

test('Story 9.1: .github/workflows/audit-signoff.yml runs the gate on mainnet-relevant paths', () => {
  assert.ok(existsSync(workflowPath), `${workflowPath} must exist`);
  const body = readFileSync(workflowPath, 'utf8');
  assert.match(body, /scripts\/check-audit-signoff\.sh/, 'workflow must run the gate script');
  assert.match(body, /paths:/, 'workflow must filter on paths so it only runs on mainnet-deploy-relevant PRs');
  assert.match(body, /programs\/susu/, 'paths filter must include programs/susu');
  assert.match(body, /Anchor\.toml/, 'paths filter must include Anchor.toml');
  assert.match(body, /release\.yml/, 'paths filter must include release.yml');
  assert.match(body, /audits\//, 'paths filter must include audits/');
});

test('Story 9.1: package.json exposes audit:check script', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.ok(pkg.scripts, 'package.json must declare scripts');
  assert.ok(pkg.scripts['audit:check'], 'package.json must declare an audit:check script');
  assert.match(pkg.scripts['audit:check'], /scripts\/check-audit-signoff\.sh/);
});

test('Story 9.1: CONTRIBUTING.md documents the audit sign-off precondition', () => {
  const body = readFileSync('CONTRIBUTING.md', 'utf8');
  assert.match(body, /audit[- ]?sign[- ]?off|audit sign-off gate|audit:check/i,
    'CONTRIBUTING.md must mention the audit sign-off precondition');
  assert.match(body, /scripts\/check-audit-signoff\.sh/, 'CONTRIBUTING.md must reference the gate script');
});

test('Story 9.1: ATDD doc exists alongside the test', () => {
  assert.ok(existsSync(atddDoc), `${atddDoc} must exist`);
  const body = readFileSync(atddDoc, 'utf8');
  assert.match(body, /Story 9\.1/);
  assert.match(body, /NFR-S1/);
});
