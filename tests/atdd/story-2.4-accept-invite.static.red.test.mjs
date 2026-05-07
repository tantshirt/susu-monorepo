import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';

const repoRoot = new URL('../../', import.meta.url);

async function readRepoFile(path) {
  return readFile(new URL(path, repoRoot), 'utf8');
}

async function readJson(path) {
  return JSON.parse(await readRepoFile(path));
}

async function listRustFiles(dirPath) {
  const dir = new URL(dirPath, repoRoot);
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const childPath = `${dirPath.replace(/\/$/, '')}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...(await listRustFiles(childPath)));
    } else if (entry.isFile() && entry.name.endsWith('.rs')) {
      files.push(childPath);
    }
  }

  return files.sort();
}

function compact(source) {
  return source.replace(/\s+/g, '');
}

function accountWindow(source, fieldName) {
  const marker = `pub ${fieldName}`;
  const index = source.indexOf(marker);
  assert.notEqual(index, -1, `missing account field ${fieldName}`);
  return source.slice(Math.max(0, index - 900), index + 260);
}

function assertSourceOrder(source, earlier, later, message) {
  const earlierIndex = source.indexOf(earlier);
  const laterIndex = source.indexOf(later);

  assert.notEqual(earlierIndex, -1, `missing earlier marker: ${earlier}`);
  assert.notEqual(laterIndex, -1, `missing later marker: ${later}`);
  assert.ok(earlierIndex < laterIndex, message);
}

test('[P0] accept_invite is exposed with the Story 2.4 no-argument public interface', async () => {
  const lib = await readRepoFile('programs/susu/src/lib.rs');
  const modules = await readRepoFile('programs/susu/src/instructions/mod.rs');
  const idl = await readJson('programs/susu/idl/susu.json');
  const instruction = (idl.instructions ?? []).find((item) => item.name === 'accept_invite');

  assert.match(lib, /\baccept_invite::AcceptInvite\b/, 'lib.rs must import AcceptInvite accounts');
  assert.match(modules, /\bpub\s+mod\s+accept_invite\s*;/, 'instructions/mod.rs must expose accept_invite');
  assert.match(
    lib,
    /pub\s+fn\s+accept_invite\s*\(\s*ctx\s*:\s*Context\s*<\s*AcceptInvite\s*>\s*\)\s*->\s*Result\s*<\s*\(\)\s*>/s,
    'program module must expose accept_invite(ctx) with no group_id or other args',
  );
  assert.match(
    lib,
    /instructions::accept_invite::handler\s*\(\s*ctx\s*\)/,
    'program handler must delegate to instructions::accept_invite::handler(ctx)',
  );

  assert.ok(instruction, 'IDL must expose accept_invite');
  assert.deepEqual(
    (instruction.accounts ?? []).map((account) => account.name),
    ['group', 'member_position', 'member', 'system_program'],
    'IDL accept_invite accounts must expose group, member_position, member, and system_program',
  );
  assert.deepEqual(instruction.args ?? [], [], 'IDL accept_invite must not require args');
});

test('[P0] accept_invite account constraints initialize the member-paid MemberPosition PDA', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/accept_invite.rs');
  const normalized = compact(source);
  const groupAccount = compact(accountWindow(source, 'group'));
  const memberPositionAccount = compact(accountWindow(source, 'member_position'));

  assert.match(source, /use\s+crate::error::SusuError\b/, 'handler must use canonical SusuError variants');
  assert.match(source, /use\s+crate::seeds::\{[^}]*GROUP_SEED[^}]*MEMBER_SEED[^}]*\}/s, 'Accounts seeds must use GROUP_SEED and MEMBER_SEED from seeds.rs');
  assert.match(source, /use\s+crate::state::\{[^}]*Group[^}]*MemberPosition[^}]*SlashStatus[^}]*\}/s, 'handler must use Group, MemberPosition, and SlashStatus');
  assert.match(source, /#\[\s*derive\s*\(\s*Accounts\s*\)\s*\]/, 'AcceptInvite must derive Accounts');
  assert.match(source, /pub\s+struct\s+AcceptInvite\s*<\s*'info\s*>/, 'AcceptInvite accounts struct must be present');
  assert.match(source, /member\s*:\s*Signer\s*<\s*'info\s*>/, 'accepting member must be a signer');
  assert.match(source, /system_program\s*:\s*Program\s*<\s*'info\s*,\s*System\s*>/, 'Anchor init requires system_program');

  assert.ok(groupAccount.includes('#[account('), 'group must have an account constraint');
  assert.ok(groupAccount.includes('mut'), 'group must be mutable so accepted can flip');
  assert.ok(
    groupAccount.includes('seeds=[GROUP_SEED,group.creator.as_ref(),group.group_id.to_le_bytes().as_ref()]'),
    'Group PDA seeds must be [GROUP_SEED, group.creator, group.group_id]',
  );
  assert.ok(groupAccount.includes('bump=group.bump'), 'Group PDA constraint must use group.bump');
  assert.ok(groupAccount.includes("Account<'info,Group>"), 'group must be an Anchor Group account');

  assert.ok(memberPositionAccount.includes('#[account('), 'member_position must have an account constraint');
  assert.ok(memberPositionAccount.includes('init'), 'member_position must be initialized by accept_invite');
  assert.ok(
    memberPositionAccount.includes('seeds=[MEMBER_SEED,group.key().as_ref(),member.key().as_ref()]'),
    'MemberPosition PDA seeds must be [MEMBER_SEED, group, member]',
  );
  assert.ok(memberPositionAccount.includes('bump'), 'MemberPosition PDA constraint must include bump');
  assert.ok(memberPositionAccount.includes('payer=member'), 'accepting member must pay MemberPosition rent');
  assert.ok(memberPositionAccount.includes('space=8+MemberPosition::INIT_SPACE'), 'MemberPosition allocation must use discriminator plus INIT_SPACE');
  assert.ok(memberPositionAccount.includes("Account<'info,MemberPosition>"), 'member_position must be an Anchor MemberPosition account');

  assert.doesNotMatch(source, /\binit_if_needed\b/, 'double accept must not silently reuse an existing MemberPosition');
  assert.doesNotMatch(normalized, /payer=creator/, 'Group creator must not pay MemberPosition rent');
});

test('[P0] accept_invite flips only the invited signer slot and initializes placeholder member state', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/accept_invite.rs');
  const normalized = compact(source);

  assert.match(
    source,
    /pub\s+fn\s+handler\s*\(\s*ctx\s*:\s*Context\s*<\s*AcceptInvite\s*>\s*\)\s*->\s*Result\s*<\s*\(\)\s*>/s,
    'handler signature must accept only Context<AcceptInvite>',
  );
  assert.match(source, /\.iter_mut\s*\(\s*\)\s*\.find\s*\(/s, 'handler must locate the signer by linear scan over group.members');
  assert.match(source, /\.pubkey\s*==\s*ctx\.accounts\.member\.key\s*\(\s*\)/s, 'linear scan must compare MemberSlot.pubkey to member signer key');
  assert.match(source, /SusuError::MemberNotInvited\b/, 'non-invited signer must return MemberNotInvited');
  assert.match(source, /SusuError::AlreadyAccepted\b/, 'already-accepted signer should return AlreadyAccepted before mutation when possible');
  assert.match(source, /\.accepted\s*=\s*true\s*;/, 'matched member slot must flip accepted to true');
  assert.match(source, /validate_accept_invite_group\s*\(\s*group\s*\)\s*\?/, 'handler must validate group lifecycle before member mutation');

  assert.ok(normalized.includes('member_position.group=group.key();'), 'MemberPosition.group must be the Group PDA');
  assert.ok(normalized.includes('member_position.member_pubkey=ctx.accounts.member.key();'), 'MemberPosition.member_pubkey must be the signer');
  assert.ok(normalized.includes('member_position.rotation_slot=u8::MAX;'), 'rotation_slot must be the u8::MAX placeholder');
  assert.ok(normalized.includes('member_position.collateral_posted=0;'), 'collateral_posted must initialize to zero');
  assert.ok(normalized.includes('member_position.contribution_history=Vec::new();'), 'contribution_history must initialize empty');
  assert.ok(normalized.includes('member_position.slash_status=SlashStatus::None;'), 'slash_status must initialize to None');

  assertSourceOrder(normalized, 'SusuError::MemberNotInvited', '.accepted=true;', 'not-invited rejection must happen before accepted mutation');
  assertSourceOrder(normalized, 'SusuError::AlreadyAccepted', '.accepted=true;', 'double-accept rejection must happen before accepted mutation when the handler runs');
  assertSourceOrder(normalized, 'validate_accept_invite_group(group)?;', '.iter_mut()', 'group lifecycle validation must happen before member lookup or mutation');
});

test('[P0] accept_invite rejects non-invited and double-accept paths without activating the group', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/accept_invite.rs');
  const normalized = compact(source);

  assert.match(source, /fn\s+validate_accept_invite_group\s*\(\s*group\s*:\s*&Group\s*\)\s*->\s*Result\s*<\s*\(\)\s*>/s, 'accept_invite must centralize the Forming/non-cancelled guard');
  assert.match(source, /matches!\s*\(\s*group\.status\s*,\s*GroupStatus::Cancelled\s*\)/, 'cancelled groups must be rejected explicitly');
  assert.match(source, /SusuError::GroupCancelled\b/, 'cancelled groups must use GroupCancelled');
  assert.match(source, /matches!\s*\(\s*group\.status\s*,\s*GroupStatus::Forming\s*\)/, 'only Forming groups may accept invites');
  assert.match(source, /SusuError::GroupAlreadyStarted\b/, 'post-forming groups must use GroupAlreadyStarted');
  assert.match(source, /SusuError::MemberNotInvited\b/, 'non-invited signer rejection must use MemberNotInvited');
  assert.ok(
    /SusuError::AlreadyAccepted\b/.test(source) || /AccountAlreadyInitialized\b/.test(source),
    'double accept must be rejected by AlreadyAccepted or the Anchor AccountAlreadyInitialized init collision',
  );
  assert.ok(normalized.includes('member_position') && normalized.includes('init'), 'one-per-(group, member) MemberPosition init must provide the PDA collision guard');
  assert.doesNotMatch(source, /GroupStatus::Active\b/, 'accept_invite must not activate the group');
  assert.doesNotMatch(normalized, /group\.status=/, 'accept_invite must not mutate Group.status');
});

test('[P1] accept_invite emits member_accepted and stays free of custody, fee, yield, transfer, or CPI scope', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/accept_invite.rs');
  const lower = source.toLowerCase();

  assert.match(
    source,
    /msg!\s*\(\s*"member_accepted\s+group_pda=\{\}\s+member=\{\}"\s*,\s*group\.key\(\)\s*,\s*ctx\.accounts\.member\.key\(\)\s*\)/s,
    'successful accept must emit member_accepted group_pda={} member={}',
  );

  for (const forbidden of [
    'anchor_spl',
    'tokenaccount',
    'token_program',
    'associated_token',
    'transfer',
    'transfer_checked',
    'cpi',
    'invoke',
    'vault',
    'custody',
    'fee',
    'yield',
  ]) {
    assert.ok(!lower.includes(forbidden), `accept_invite must not introduce ${forbidden} behavior`);
  }

  for (const file of await listRustFiles('programs/susu/src')) {
    if (file === 'programs/susu/src/seeds.rs') {
      continue;
    }
    const rust = await readRepoFile(file);
    assert.doesNotMatch(rust, /b"(group|member)"/, `${file} must not inline group/member seed literals`);
  }
});

test('[P1] Story 2.4 runtime or proxy coverage is present for Step 3 development', async () => {
  const path = 'programs/susu/tests/accept.rs';
  await access(new URL(path, repoRoot));
  const source = await readRepoFile(path);

  for (const expected of [
    'test_accept_invite_happy_path',
    'test_accept_invite_not_invited',
    'test_accept_invite_double_accept',
    'test_accept_invite_rejects_non_forming_and_cancelled_groups',
    'test_accept_invite_member_pays_rent',
    'test_accept_invite_no_activation_or_token_side_effects',
  ]) {
    assert.match(source, new RegExp(`fn\\s+${expected}\\b`), `${path} must cover ${expected}`);
  }

  for (const expected of [
    'MEMBER_SEED',
    'u8::MAX',
    'collateral_posted',
    'contribution_history',
    'SlashStatus::None',
    'MemberNotInvited',
    'GroupAlreadyStarted',
    'GroupCancelled',
    'member_accepted',
    'GroupStatus::Forming',
    'GroupStatus::Active',
    'GroupStatus::Completed',
    'GroupStatus::Cancelled',
  ]) {
    assert.match(source, new RegExp(`\\b${expected.replace('::', '::')}\\b`), `${path} must assert ${expected}`);
  }

  assert.ok(
    /\bAlreadyAccepted\b/.test(source) || /\bAccountAlreadyInitialized\b/.test(source),
    `${path} must assert double accept via AlreadyAccepted or AccountAlreadyInitialized`,
  );
});
