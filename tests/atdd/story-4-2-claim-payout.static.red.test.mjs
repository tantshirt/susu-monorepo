import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const claimPath = 'programs/susu/src/instructions/claim_payout.rs';
const receiptPath = 'programs/susu/src/state/rotation_receipt.rs';
const seedsPath = 'programs/susu/src/seeds.rs';

function compact(source) {
  return source.replace(/\s+/g, '');
}

test('Story 4.2 claim_payout exposes the required token payout accounts', () => {
  const source = readFileSync(claimPath, 'utf8');

  for (const account of [
    'group',
    'member_position',
    'member',
    'recipient_token_account',
    'vault',
    'mint',
    'rotation_receipt',
    'token_program',
    'system_program',
    'clock',
  ]) {
    assert.match(source, new RegExp(`\\b${account}\\b`), `ClaimPayout must include ${account}`);
  }

  assert.match(source, /anchor_spl::token::\{[^}]*TransferChecked/s, 'must use checked SPL token transfers');
  assert.match(source, /token::transfer_checked\b/, 'must transfer checked raw token units');
});

test('Story 4.2 receipt PDA uses ROTATION_SEED, group PDA, and little-endian rotation index', () => {
  const source = readFileSync(claimPath, 'utf8');
  const seeds = readFileSync(seedsPath, 'utf8');
  const squashed = compact(source);

  assert.match(seeds, /ROTATION_SEED\s*:\s*&\[u8\]/, 'ROTATION_SEED must be defined');
  assert.match(source, /init,/, 'rotation receipt must be initialized by claim_payout');
  assert.match(source, /space\s*=\s*8\s*\+\s*RotationReceipt::INIT_SPACE/, 'receipt space must use InitSpace');
  assert.match(
    squashed,
    /seeds=\[ROTATION_SEED,group\.key\(\)\.as_ref\(\),rotation_index\.to_le_bytes\(\)\.as_ref\(\)\]/,
    'receipt PDA seeds must be [ROTATION_SEED, group, rotation_index_le_bytes]',
  );
});

test('Story 4.2 validates recipient, active status, and closed period before CPI', () => {
  const source = readFileSync(claimPath, 'utf8');
  const squashed = compact(source);

  assert.match(source, /GroupStatus::Active/, 'must require an Active group');
  assert.match(source, /MemberPositionMismatch/, 'must bind MemberPosition to signer and group');
  assert.match(source, /NotRotationRecipient/, 'must reject signers who are not the rotation recipient');
  assert.match(source, /RotationNotClosed/, 'must reject claims before the rotation closes');
  assert.match(source, /Clock/, 'must use the Solana Clock sysvar');

  const active = squashed.indexOf('GroupStatus::Active');
  const recipient = squashed.indexOf('NotRotationRecipient');
  const closed = squashed.indexOf('RotationNotClosed');
  const cpi = squashed.indexOf('CpiContext::new_with_signer');
  assert.ok(active !== -1 && active < cpi, 'active check must precede vault transfer CPI');
  assert.ok(recipient !== -1 && recipient < cpi, 'recipient check must precede vault transfer CPI');
  assert.ok(closed !== -1 && closed < cpi, 'close-time check must precede vault transfer CPI');
});

test('Story 4.2 records canonical receipt fields and emits payout_claimed', () => {
  const claim = readFileSync(claimPath, 'utf8');
  const receipt = readFileSync(receiptPath, 'utf8');

  for (const field of ['group', 'rotation_index', 'amount', 'recipient', 'claimed_at', 'bump']) {
    assert.match(receipt, new RegExp(`pub\\s+${field}\\s*:`), `RotationReceipt must store ${field}`);
    assert.match(claim, new RegExp(`\\.${field}\\s*=`), `claim_payout must populate receipt.${field}`);
  }

  assert.doesNotMatch(receipt, /\bsignature\b/, 'receipt must not store transaction signatures');
  assert.match(claim, /payout_claimed:/, 'must emit payout_claimed log');
  assert.match(claim, /group=.*rotation=.*recipient=.*amount=/s, 'payout log must include group, rotation, recipient, amount');
});

test('Story 4.2 has no scheduler, keeper, oracle, or automation dependency', () => {
  const source = readFileSync(claimPath, 'utf8');
  assert.doesNotMatch(source, /scheduler|keeper|cron|clockwork|chainlink|oracle|automation|bot/i);
});

