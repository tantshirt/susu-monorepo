import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

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

function assertSourceOrder(source, earlier, later, message) {
  const earlierIndex = source.indexOf(earlier);
  const laterIndex = source.indexOf(later);

  assert.notEqual(earlierIndex, -1, `missing earlier marker: ${earlier}`);
  assert.notEqual(laterIndex, -1, `missing later marker: ${later}`);
  assert.ok(earlierIndex < laterIndex, message);
}

test('[P0] invite_members is wired into the Anchor program and IDL', async () => {
  const lib = await readRepoFile('programs/susu/src/lib.rs');
  const modules = await readRepoFile('programs/susu/src/instructions/mod.rs');
  const idl = await readJson('programs/susu/idl/susu.json');
  const instruction = (idl.instructions ?? []).find((item) => item.name === 'invite_members');

  assert.match(lib, /\binvite_members::InviteMembers\b/, 'lib.rs must import InviteMembers accounts');
  assert.match(modules, /\bpub\s+mod\s+invite_members\s*;/, 'instructions/mod.rs must expose invite_members');
  assert.match(
    lib,
    /pub\s+fn\s+invite_members\s*\(\s*ctx\s*:\s*Context\s*<\s*InviteMembers\s*>\s*,\s*invitees\s*:\s*Vec\s*<\s*Pubkey\s*>\s*\)\s*->\s*Result\s*<\s*\(\)\s*>/s,
    'program module must expose invite_members(ctx, invitees: Vec<Pubkey>)',
  );
  assert.match(lib, /instructions::invite_members::handler\s*\(\s*ctx\s*,\s*invitees\s*\)/, 'program handler must delegate to instructions::invite_members::handler');

  assert.ok(instruction, 'IDL must expose invite_members');
  assert.deepEqual(
    (instruction.accounts ?? []).map((account) => account.name),
    ['creator', 'group'],
    'IDL invite_members accounts must be only creator and group',
  );
  assert.deepEqual(
    (instruction.args ?? []).map((arg) => [arg.name, arg.type?.vec ?? arg.type]),
    [['invitees', 'pubkey']],
    'IDL invite_members args must be invitees: Vec<pubkey>',
  );
});

test('[P0] invite_members account constraints enforce creator-only access to the Group PDA', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/invite_members.rs');
  const normalized = compact(source);

  assert.match(source, /use\s+crate::error::SusuError\b/, 'handler must use canonical SusuError variants');
  assert.match(source, /use\s+crate::seeds::GROUP_SEED\b/, 'Accounts seeds must use GROUP_SEED from seeds.rs');
  assert.match(source, /use\s+crate::state::\{[^}]*Group[^}]*GroupStatus[^}]*MemberSlot[^}]*\}/s, 'handler must use Group, GroupStatus, and MemberSlot');
  assert.match(source, /#\[\s*derive\s*\(\s*Accounts\s*\)\s*\]/, 'InviteMembers must derive Accounts');
  assert.match(source, /pub\s+struct\s+InviteMembers\s*<\s*'info\s*>/, 'InviteMembers accounts struct must be present');
  assert.match(source, /creator\s*:\s*Signer\s*<\s*'info\s*>/, 'creator must be a signer');
  assert.match(source, /group\s*:\s*Account\s*<\s*'info\s*,\s*Group\s*>/, 'group must be an Anchor Group account');
  assert.match(source, /#\[\s*account\s*\([\s\S]*\bmut\b[\s\S]*\bhas_one\s*=\s*creator[\s\S]*\)\s*\]\s*pub\s+group\s*:/, 'group account must be mutable and has_one creator');
  assert.ok(
    normalized.includes('seeds=[GROUP_SEED,creator.key().as_ref(),group.group_id.to_le_bytes().as_ref()]'),
    'Group PDA seeds must be [GROUP_SEED, creator, group.group_id]',
  );
  assert.match(source, /\bbump\b/, 'Group PDA constraint must include bump');
  assert.doesNotMatch(source, /\b(init|init_if_needed|realloc|close|payer\s*=|space\s*=|system_program)\b/, 'invite_members must mutate existing Group only');
});

test('[P0] invite_members validates Forming status and exact count before mutation', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/invite_members.rs');
  const normalized = compact(source);

  assert.match(
    source,
    /pub\s+fn\s+handler\s*\(\s*ctx\s*:\s*Context\s*<\s*InviteMembers\s*>\s*,\s*invitees\s*:\s*Vec\s*<\s*Pubkey\s*>\s*\)\s*->\s*Result\s*<\s*\(\)\s*>/s,
    'handler signature must accept invitees: Vec<Pubkey>',
  );
  assert.ok(
    normalized.includes('require!(group.status==GroupStatus::Forming,SusuError::GroupAlreadyStarted)'),
    'non-Forming groups must return GroupAlreadyStarted',
  );
  assert.ok(
    normalized.includes('require!(invitees.len()==group.nasusize,SusuError::InvalidMemberCount)'),
    'invitee count must exactly match Group.n',
  );
  assertSourceOrder(
    normalized,
    'require!(group.status==GroupStatus::Forming,SusuError::GroupAlreadyStarted)',
    'group.members=',
    'status validation must run before members mutation',
  );
  assertSourceOrder(
    normalized,
    'require!(invitees.len()==group.nasusize,SusuError::InvalidMemberCount)',
    'group.members=',
    'count validation must run before members mutation',
  );

  for (const partialMutation of ['.push(', '.extend(', '.append(', '.resize(', '.truncate(', '.clear(']) {
    assert.ok(!normalized.includes(partialMutation), `invite_members must not use partial roster mutation ${partialMutation}`);
  }
});

test('[P0] invite_members writes ordered MemberSlot roster entries into Group.members', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/invite_members.rs');
  const normalized = compact(source);

  assert.ok(normalized.includes('group.members=invitees.into_iter().map('), 'invite_members must map input invitees in order');
  assert.match(source, /MemberSlot\s*\{\s*pubkey\s*:\s*[^,]+,\s*accepted\s*:\s*false\s*\}/s, 'each invitee must become an unaccepted MemberSlot');
  assert.ok(normalized.includes('.collect();'), 'mapped MemberSlot entries must be collected into Group.members');
  assert.doesNotMatch(source, /\bMemberPosition\b/, 'Story 2.3 must not create MemberPosition PDAs');
});

test('[P1] invite_members keeps duplicate-pubkey policy scoped to Story 2.4', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/invite_members.rs');

  for (const forbidden of ['HashSet', '.dedup', 'Duplicate', 'AlreadyAccepted', 'MemberNotInvited']) {
    assert.doesNotMatch(source, new RegExp(forbidden.replace('.', '\\.')), `Story 2.3 must not reject duplicate invitees via ${forbidden}`);
  }
});

test('[P0] invite_members avoids separate Invite PDA and documents public queryability via Group.members', async () => {
  const inviteSource = await readRepoFile('programs/susu/src/instructions/invite_members.rs');
  const docs = await readRepoFile('docs/architecture-notes.md');

  assert.doesNotMatch(inviteSource, /\bstruct\s+Invite\b/, 'must not introduce an Invite account type');
  assert.doesNotMatch(inviteSource, /\bInvitePda\b|\binvite_pda\b|\binvite_account\b/, 'must not introduce a separate Invite PDA');
  assert.doesNotMatch(inviteSource, /\bProgram\s*<\s*'info\s*,\s*System\s*>/, 'existing Group mutation must not require system program');
  assert.match(docs, /ADR-001:\s*Invite via Group roster, not separate Invite PDA/i, 'architecture notes must record ADR-001');
  assert.match(docs, /Group\.members/i, 'ADR must identify Group.members as the roster source of truth');
  assert.match(docs, /getAccountInfo/i, 'ADR must document public queryability through standard account reads');
  assert.match(docs, /rent/i, 'ADR must explain rent savings from avoiding Invite PDAs');
});

test('[P1] invite_members emits members_invited and remains metadata-only', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/invite_members.rs');
  const lower = source.toLowerCase();

  assert.match(
    source,
    /msg!\s*\(\s*"members_invited\s+group_pda=\{\}\s+count=\{\}"\s*,\s*group\.key\(\)\s*,\s*group\.members\.len\(\)\s*\)/s,
    'successful invite must emit members_invited group_pda={} count={}',
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
    assert.ok(!lower.includes(forbidden), `invite_members must not introduce ${forbidden} behavior`);
  }

  for (const file of await listRustFiles('programs/susu/src')) {
    if (file === 'programs/susu/src/seeds.rs') {
      continue;
    }
    const rust = await readRepoFile(file);
    assert.doesNotMatch(rust, /b"group"/, `${file} must not inline the group seed literal`);
  }
});
