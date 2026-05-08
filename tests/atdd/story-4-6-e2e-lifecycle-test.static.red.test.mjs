import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const lifecycleTestPath = 'programs/susu/tests/full_lifecycle.rs';
const completeGroupPath = 'programs/susu/src/instructions/complete_group.rs';
const libPath = 'programs/susu/src/lib.rs';
const modPath = 'programs/susu/src/instructions/mod.rs';
const claimPath = 'programs/susu/src/instructions/claim_payout.rs';
const withdrawPath = 'programs/susu/src/instructions/withdraw_collateral.rs';
const coveragePath = 'tests/coverage/threat-model.md';
const surfpoolPath = 'docs/surfpool-status.md';

const forbiddenSchedulerTokens = [
  /\bscheduler\b/i,
  /\bkeeper\b/i,
  /\bcron\b/i,
  /\bautomation\b/i,
  /\bexecutor\b/i,
  /\bbot\b/i,
  /\bchainlink\b/i,
  /\bclockwork\b/i,
];

function read(path) {
  return readFileSync(path, 'utf8');
}

function compact(source) {
  return source.replace(/\s+/g, '');
}

test('Story 4.6 has an executable full lifecycle fallback test', () => {
  assert.ok(existsSync(lifecycleTestPath), 'programs/susu/tests/full_lifecycle.rs must exist');
  const source = read(lifecycleTestPath);

  for (const requiredToken of [
    'story_4_6_full_lifecycle',
    'apply_invite_members',
    'apply_accept_invite',
    'assign_rotation_slots_for_start',
    'assert_rotation_recipient',
    'assert_rotation_closed',
    'verify_rotation_funded',
    'complete_group_after_all_rotation_receipts',
    'withdraw_all_collateral',
    'RotationReceipt',
    'ROTATION_SEED',
    'elapsed',
    'Duration::from_secs(30)',
  ]) {
    assert.match(source, new RegExp(requiredToken), `lifecycle test must include ${requiredToken}`);
  }
});

test('Story 4.6 lifecycle derives claim recipients from realized rotation slots', () => {
  const source = read(lifecycleTestPath);

  assert.match(source, /rotation_slot\s*==\s*rotation_index/, 'claims must select recipients by realized rotation_slot');
  assert.match(source, /find\([^)]*rotation_slot/s, 'test must search by slot instead of relying on roster order');
  assert.doesNotMatch(source, /members\s*\[\s*0\s*\][\s\S]{0,120}rotation[_ ]?0/i, 'must not hard-code member[0] as rotation 0 recipient');
  assert.doesNotMatch(source, /slot\s*0\s*==\s*member\s*0/i, 'must not assume slot 0 equals member 0');
});

test('Story 4.6 exposes a signed complete_group transition before collateral withdrawal', () => {
  assert.ok(existsSync(completeGroupPath), 'complete_group instruction must exist');
  const completeGroup = read(completeGroupPath);
  const lib = read(libPath);
  const mod = read(modPath);
  const withdraw = read(withdrawPath);

  assert.match(mod, /pub mod complete_group;/, 'instruction module must be exported');
  assert.match(lib, /CompleteGroup/, 'lib must import CompleteGroup accounts');
  assert.match(lib, /pub fn complete_group\b/, 'program must expose complete_group');
  assert.match(completeGroup, /caller:\s*Signer<'info>/, 'completion must be an explicit signed transaction');
  assert.match(completeGroup, /complete_group_after_all_rotation_receipts/, 'handler must delegate to a testable receipt verifier');
  assert.match(completeGroup, /GroupStatus::Completed/, 'completion must set the terminal Completed state');
  assert.match(completeGroup, /ROTATION_SEED/, 'completion must verify canonical receipt PDAs');
  assert.match(withdraw, /GroupStatus::Completed/, 'withdraw_collateral must remain gated on Completed');
});

test('Story 4.6 lifecycle verifies every receipt and zero terminal balances', () => {
  const source = read(lifecycleTestPath);

  assert.match(source, /for\s+rotation_index\s+in\s+0\.\.N/, 'test must iterate all rotations');
  assert.match(source, /receipt\.recipient/, 'test must assert receipt recipients');
  assert.match(source, /receipt\.amount/, 'test must assert receipt amount');
  assert.match(source, /collateral_posted,\s*0/, 'test must assert all collateral is withdrawn');
  assert.match(source, /vault_balance,\s*0/, 'test must assert no modeled vault funds are stranded');
});

test('Story 4.6 capstone has no scheduler-style dependency tokens', () => {
  const combined = [lifecycleTestPath, completeGroupPath, claimPath]
    .filter((path) => existsSync(path))
    .map(read)
    .join('\n');

  for (const forbidden of forbiddenSchedulerTokens) {
    assert.doesNotMatch(combined, forbidden, `Story 4.6 must not rely on ${forbidden}`);
  }
});

test('Story 4.6 documents FR20 coverage and Surfpool fallback status', () => {
  assert.ok(existsSync(coveragePath), 'tests/coverage/threat-model.md must exist');
  const coverage = read(coveragePath);
  const surfpool = read(surfpoolPath);

  assert.match(coverage, /FR20/i, 'coverage doc must name FR20');
  assert.match(coverage, /Story 4\.6/i, 'coverage doc must name Story 4.6');
  assert.match(coverage, /programs\/susu\/tests\/full_lifecycle\.rs/, 'coverage doc must reference the capstone test');
  assert.match(coverage, /story-4-6-e2e-lifecycle-test\.static\.red\.test\.mjs/, 'coverage doc must reference the static ATDD check');
  assert.match(coverage, /Surfpool/i, 'coverage doc must record the Surfpool acceptance status');
  assert.match(surfpool, /LiteSVM-fallback/i, 'Surfpool remains explicitly fallback-gated until host support exists');
});
