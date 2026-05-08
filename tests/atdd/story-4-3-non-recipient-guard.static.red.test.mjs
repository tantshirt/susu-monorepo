import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const claimPath = 'programs/susu/src/instructions/claim_payout.rs';
const source = fs.readFileSync(claimPath, 'utf8');

function compact(text) {
  return text.replace(/\s+/g, '');
}

function accountStructBody() {
  const match = source.match(/pub struct ClaimPayout<'info> \{(?<body>[\s\S]*?)\n\}/);
  assert.ok(match?.groups?.body, 'ClaimPayout accounts struct must exist');
  return match.groups.body;
}

function handlerBody() {
  const match = source.match(/pub fn handler\([\s\S]*?\) -> Result<\(\)> \{(?<body>[\s\S]*?)\n\}\n\npub fn/);
  assert.ok(match?.groups?.body, 'claim_payout handler must exist');
  return match.groups.body;
}

test('Story 4.3 binds member_position PDA to the claiming signer', () => {
  const accounts = compact(accountStructBody());

  assert.match(
    accounts,
    /seeds=\[MEMBER_SEED,group\.key\(\)\.as_ref\(\),member\.key\(\)\.as_ref\(\)\]/,
    'member_position seeds must use the signer key, not a caller-supplied recipient key',
  );
  assert.match(accounts, /pubmember:Signer<'info>/, 'claiming member must be the transaction signer');
  assert.match(
    accounts,
    /member_position\.group==group\.key\(\)@SusuError::MemberPositionMismatch/,
    'member_position must be constrained to the claimed group',
  );
  assert.match(
    accounts,
    /member_position\.member_pubkey==member\.key\(\)@SusuError::MemberPositionMismatch/,
    'member_position state must be constrained to the signer key',
  );
});

test('Story 4.3 uses a recipient-validation helper that returns NotRotationRecipient', () => {
  assert.match(source, /pub fn assert_rotation_recipient\(/, 'recipient guard should be unit-testable');
  assert.match(source, /SusuError::NotRotationRecipient/, 'wrong-slot member must map to NotRotationRecipient');
});

test('Story 4.3 rejects wrong-slot members before deadline checks and transfer CPI', () => {
  const handler = compact(handlerBody());
  const recipientGuard = handler.indexOf('assert_rotation_recipient(');
  const deadline = handler.indexOf('rotation_close_timestamp(');
  const cpi = handler.indexOf('CpiContext::new_with_signer');

  assert.notEqual(recipientGuard, -1, 'handler must call the recipient guard');
  assert.ok(recipientGuard < deadline, 'wrong recipient must fail before deadline checks');
  assert.ok(recipientGuard < cpi, 'wrong recipient must fail before token transfer');
});

test('Story 4.3 keeps receipt PDA canonical and isolated from member identity', () => {
  const accounts = compact(accountStructBody());

  assert.match(
    accounts,
    /seeds=\[ROTATION_SEED,group\.key\(\)\.as_ref\(\),rotation_index\.to_le_bytes\(\)\.as_ref\(\)\]/,
    'rotation receipt PDA must stay canonical per group and rotation',
  );
  assert.doesNotMatch(
    accounts,
    /ROTATION_SEED,group\.key\(\)\.as_ref\(\),member\.key\(\)\.as_ref\(\)/,
    'receipt PDA must not be scoped by the claimant signer',
  );
});
