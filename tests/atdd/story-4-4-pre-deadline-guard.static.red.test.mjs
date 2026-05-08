import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const claimPath = 'programs/susu/src/instructions/claim_payout.rs';
const errorPath = 'programs/susu/src/error.rs';
const idlPath = 'programs/susu/idl/susu.json';
const claimTestPath = 'programs/susu/tests/claim_payout.rs';

const claimSource = readFileSync(claimPath, 'utf8');
const errorSource = readFileSync(errorPath, 'utf8');

function compact(source) {
  return source.replace(/\s+/g, '');
}

function handlerBody() {
  const match = claimSource.match(/pub fn handler\([\s\S]*?\) -> Result<\(\)> \{(?<body>[\s\S]*?)\n\}\n\npub fn/);
  assert.ok(match?.groups?.body, 'claim_payout handler must exist');
  return match.groups.body;
}

test('Story 4.4 exposes ContributionPeriodOpen as the pre-deadline error', () => {
  const idl = JSON.parse(readFileSync(idlPath, 'utf8'));

  assert.match(errorSource, /ContributionPeriodOpen/, 'SusuError must include ContributionPeriodOpen');
  assert.match(
    errorSource,
    /#\[msg\("This rotation's contribution period is still open\."\)\][\s\S]{0,140}ContributionPeriodOpen/,
    'ContributionPeriodOpen must have the canonical story message',
  );
  assert.ok(
    (idl.errors ?? []).some((entry) => entry.name === 'ContributionPeriodOpen'),
    'checked-in IDL must expose ContributionPeriodOpen',
  );
});

test('4.4-INT-001/002 rejects deadline - 1 and deadline before receipt writes and transfer CPI', () => {
  const handler = compact(handlerBody());
  const deadlineGuard = handler.indexOf('assert_rotation_closed(');
  const fundingGuard = handler.indexOf('verify_rotation_funded(');
  const receiptWrite = handler.indexOf('letreceipt=&mutctx.accounts.rotation_receipt');
  const cpi = handler.indexOf('CpiContext::new_with_signer');

  assert.notEqual(deadlineGuard, -1, 'handler must use a testable assert_rotation_closed helper');
  assert.ok(claimSource.includes('SusuError::ContributionPeriodOpen'), 'deadline guard must reject with ContributionPeriodOpen');
  assert.ok(deadlineGuard < fundingGuard, 'pre-deadline rejection must take precedence over underfunded-rotation checks');
  assert.ok(deadlineGuard < receiptWrite, 'pre-deadline rejection must happen before receipt field writes');
  assert.ok(deadlineGuard < cpi, 'pre-deadline rejection must happen before token transfer');
});

test('4.4-INT-003 uses strict clock greater-than semantics for successful claims', () => {
  const source = compact(claimSource);

  assert.match(
    source,
    /clock_unix_timestamp>close_timestamp[\s\S]*SusuError::ContributionPeriodOpen/,
    'claims must pass only when Clock.unix_timestamp is strictly greater than the close timestamp',
  );
  assert.doesNotMatch(
    source,
    /clock_unix_timestamp>=close_timestamp/,
    'deadline equality must not be accepted',
  );
});

test('4.4-UNIT-005 deadline computation is checked and non-saturating', () => {
  const closeFn = claimSource.match(/pub fn rotation_close_timestamp\([\s\S]*?\n\}/)?.[0] ?? '';

  assert.match(closeFn, /checked_add/, 'deadline math must use checked_add');
  assert.match(closeFn, /checked_mul/, 'deadline math must use checked_mul');
  assert.match(closeFn, /SusuError::ArithmeticOverflow/, 'deadline overflow must map to ArithmeticOverflow');
  assert.doesNotMatch(closeFn, /saturating_|wrapping_|panic!|assert!/, 'deadline math must not saturate, wrap, panic, or assert');
});

test('4.4-INT-004 Rust guard tests cover n values 3, 7, 10 and boundary rotations', () => {
  const source = readFileSync(claimTestPath, 'utf8');

  assert.match(source, /claim_payout_pre_deadline_guard_rejects_until_strictly_after_close/, 'Rust guard matrix test must exist');
  for (const n of [3, 7, 10]) {
    assert.match(source, new RegExp(`\\b${n}_u8\\b`), `Rust tests must cover n=${n}`);
  }
  assert.match(source, /deadline - 1/, 'Rust tests must assert deadline - 1 rejection');
  assert.match(source, /deadline,/, 'Rust tests must assert exact deadline rejection');
  assert.match(source, /deadline \+ 1/, 'Rust tests must assert deadline + 1 success');
  assert.match(source, /rotation_index: 0/, 'Rust tests must cover first rotation');
  assert.match(source, /rotation_index: n - 1/, 'Rust tests must cover final rotation');
});
