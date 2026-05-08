import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const claimPath = 'programs/susu/src/instructions/claim_payout.rs';
const errorPath = 'programs/susu/src/error.rs';
const receiptPath = 'programs/susu/src/state/rotation_receipt.rs';
const groupPath = 'programs/susu/src/state/group.rs';
const memberPositionPath = 'programs/susu/src/state/member_position.rs';
const seedsPath = 'programs/susu/src/seeds.rs';
const idlPath = 'programs/susu/idl/susu.json';
const claimTestPath = 'programs/susu/tests/claim_payout.rs';
const threatModelPath = 'docs/threat-model.md';

function compact(source) {
  return source.replace(/\s+/g, '');
}

test('Story 4.5 exposes a stable AlreadyClaimed program error', () => {
  const source = readFileSync(errorPath, 'utf8');
  const idl = JSON.parse(readFileSync(idlPath, 'utf8'));

  assert.match(source, /AlreadyClaimed/, 'SusuError must include AlreadyClaimed');
  assert.match(
    source,
    /#\[msg\("Rotation has already been claimed\."\)\][\s\S]{0,120}AlreadyClaimed/,
    'AlreadyClaimed must have the canonical message',
  );

  const errors = new Set((idl.errors ?? []).map((entry) => entry.name));
  assert.ok(errors.has('AlreadyClaimed'), 'checked-in IDL must expose AlreadyClaimed');
});

test('Story 4.5 keeps RotationReceipt init as the structural duplicate-claim guard', () => {
  const claim = readFileSync(claimPath, 'utf8');
  const seeds = readFileSync(seedsPath, 'utf8');
  const squashed = compact(claim);

  assert.match(seeds, /ROTATION_SEED\s*:\s*&\[u8\]/, 'ROTATION_SEED must remain the receipt seed source');
  assert.match(claim, /rotation_receipt\s*:\s*Account<'info,\s*RotationReceipt>/, 'claim_payout must own RotationReceipt');
  assert.match(claim, /init,/, 'rotation_receipt must use Anchor init so an existing PDA rejects');
  assert.match(claim, /payer\s*=\s*member/, 'the claiming member must pay for the first receipt init');
  assert.match(claim, /space\s*=\s*8\s*\+\s*RotationReceipt::INIT_SPACE/, 'receipt space must use InitSpace');
  assert.match(
    squashed,
    /seeds=\[ROTATION_SEED,group\.key\(\)\.as_ref\(\),rotation_index\.to_le_bytes\(\)\.as_ref\(\)\]/,
    'receipt PDA must be keyed by rotation_index little-endian bytes',
  );
});

test('Story 4.5 does not add runtime claimed flags that can drift from receipt existence', () => {
  const combinedState = [groupPath, memberPositionPath, receiptPath]
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');

  assert.doesNotMatch(
    combinedState,
    /\b(?:claimed|has_claimed|is_claimed|payout_claimed)\s*:\s*bool\b/i,
    'double-claim state must not use a runtime boolean flag',
  );
});

test('Story 4.5 duplicate-claim tests lock account-validation and per-rotation guard evidence', () => {
  const source = readFileSync(claimTestPath, 'utf8');

  for (const requiredToken of [
    'double_claim_rejection_uses_receipt_existence_guard',
    'has_no_existing_receipt_mutation_path',
    'claimed_rotation_zero_does_not_block_rotation_one_receipt',
    'AlreadyClaimed',
    'init_if_needed',
    'realloc',
    'transfer_checked',
  ]) {
    assert.match(source, new RegExp(requiredToken), `claim_payout tests must include ${requiredToken}`);
  }

  assert.match(source, /receipt_init[\s\S]*accounts_start[\s\S]*handler_start/, 'tests must prove receipt init is account-validation-time');
  assert.match(source, /assert_ne!\([^;]*rotation_0_receipt[^;]*rotation_1_receipt/s, 'tests must prove per-rotation PDA isolation');
});

test('Story 4.5 documents RotationReceipt existence-as-proof in the threat model', () => {
  const source = readFileSync(threatModelPath, 'utf8');

  assert.match(source, /Double-claim defense/i, 'threat model must include a double-claim defense section');
  assert.match(source, /RotationReceipt\[i\].*canonical on-chain proof/is, 'doc must name receipt existence as proof');
  assert.match(source, /Anchor `init` constraint|Anchor init constraint/i, 'doc must explain init-on-existing-account rejection');
  assert.match(source, /programs\/susu\/tests\/claim_payout\.rs/, 'doc must reference the program test path');
  assert.match(
    source,
    /tests\/atdd\/story-4-5-double-claim-guard\.static\.red\.test\.mjs/,
    'doc must reference the ATDD guard test',
  );
});
