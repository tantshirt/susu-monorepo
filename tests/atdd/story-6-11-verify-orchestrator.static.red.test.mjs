import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const verify = readFileSync('scripts/verify.sh', 'utf8');
const immutability = readFileSync('scripts/check-immutability.sh', 'utf8');
const workflow = readFileSync('.github/workflows/verify.yml', 'utf8');
const contributing = readFileSync('CONTRIBUTING.md', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

test('Story 6.11 exposes pnpm verify through the root package', () => {
  assert.equal(pkg.scripts.verify, 'bash scripts/verify.sh');
});

test('Story 6.11 verify script runs the full reproducibility chain', () => {
  for (const expected of [
    'pnpm install --frozen-lockfile',
    'anchor build',
    'anchor test',
    'cargo test --workspace',
    'cargo run --bin susu-adversary --release',
    'pnpm susu:demo',
    'scripts/check-idl-hash.sh',
    'scripts/check-sdk-parity.sh',
    'scripts/check-immutability.sh',
    'scripts/check-i18n-parity.ts',
  ]) {
    assert.match(verify, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(verify, /SUSU_VERIFY_MAX_SECONDS:-600/);
  assert.match(verify, /last 50 log lines/);
});

test('Story 6.11 immutability check skips non-mainnet and fails on upgrade authority', () => {
  assert.match(immutability, /CLUSTER.*mainnet-beta/);
  assert.match(immutability, /skipped .*mainnet-only/);
  assert.match(immutability, /upgrade authority/);
});

test('Story 6.11 adds main-branch verify CI and contributor docs', () => {
  assert.match(workflow, /branches:\n\s+- main/);
  assert.doesNotMatch(workflow, /ghcr\.io\/coral-xyz\/anchor/);
  assert.match(workflow, /dtolnay\/rust-toolchain/);
  assert.match(workflow, /Install Anchor CLI/);
  assert.match(workflow, /bash scripts\/verify\.sh/);
  assert.match(contributing, /Reproducing every claim in <10 minutes/);
});
