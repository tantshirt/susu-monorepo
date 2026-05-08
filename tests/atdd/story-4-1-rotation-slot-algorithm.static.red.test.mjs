import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const rotationPath = 'programs/susu/src/rotation.rs';
const startPath = 'programs/susu/src/instructions/start_contributions.rs';
const seedsPath = 'programs/susu/src/seeds.rs';
const docsPath = 'docs/rotation-assignment.md';

function compact(source) {
  return source.replace(/\s+/g, '');
}

test('Story 4.1 defines a deterministic rotation module with canonical hash-rank inputs', () => {
  assert.ok(existsSync(rotationPath), 'programs/susu/src/rotation.rs must exist');
  const source = readFileSync(rotationPath, 'utf8');
  const squashed = compact(source);

  assert.match(source, /pub\s+struct\s+RotationAssignment\b/, 'must expose assignment records');
  assert.match(source, /pub\s+fn\s+calculate_rotation_assignments\b/, 'must expose pure assignment helper');
  assert.match(source, /hashv|Sha256|sha256/i, 'must use SHA-256-compatible hashing');
  assert.match(
    squashed,
    /group(?:_pda)?\.as_ref\(\).*member(?:_pubkey)?\.as_ref\(\).*ROTATION_SLOT_SEED/s,
    'hash input order must be group_pda || member_pubkey || slot_seed',
  );
  assert.match(source, /sort(?:_by|_unstable_by)/, 'must rank members by deterministic sorted hash');
  assert.doesNotMatch(source, /Clock::get|unix_timestamp|recent_blockhash|getrandom|thread_rng|random\(|env::|oracle|keeper|scheduler/i);
});

test('Story 4.1 start_contributions assigns slots before activating the group', () => {
  const source = readFileSync(startPath, 'utf8');
  const squashed = compact(source);

  assert.match(source, /assign_rotation_slots_for_start\b/, 'start_contributions must call assignment routine');
  assert.match(source, /try_borrow_mut_data/, 'remaining MemberPosition accounts must be writable and serialized back');
  assert.match(source, /rotation_slot\s*=\s*assignment\.slot/, 'final slots must be written into MemberPosition.rotation_slot');
  assert.match(source, /slots_assigned/, 'must emit slots_assigned log');
  assert.match(source, /member=.*slot=|slot=.*member=/s, 'slots_assigned log must list member and slot pairs');

  const assign = squashed.indexOf('assign_rotation_slots_for_start');
  const active = squashed.indexOf('group.status=GroupStatus::Active');
  assert.ok(assign !== -1 && active !== -1 && assign < active, 'assignment must precede Active status mutation');
});

test('Story 4.1 uses a named protocol slot seed and documents the replay algorithm', () => {
  const seeds = readFileSync(seedsPath, 'utf8');
  assert.match(seeds, /ROTATION_SLOT_SEED\s*:\s*&\[u8\]/, 'slot seed must be a named seed constant');

  assert.ok(existsSync(docsPath), 'docs/rotation-assignment.md must exist');
  const docs = readFileSync(docsPath, 'utf8');
  assert.match(docs, /sha256\(group_pda\s*\|\|\s*member_pubkey\s*\|\|\s*slot_seed\)/i);
  assert.match(docs, /worked example/i, 'documentation must include a worked example');
  assert.match(docs, /sort|rank/i, 'documentation must describe rank ordering');
  assert.match(docs, /slot\s+0|slot=0/i, 'documentation must show at least one concrete assigned slot');
});
