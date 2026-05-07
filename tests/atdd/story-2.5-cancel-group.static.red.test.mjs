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

test('[P0] cancel_group is wired into the Anchor program and IDL', async () => {
  const lib = await readRepoFile('programs/susu/src/lib.rs');
  const modules = await readRepoFile('programs/susu/src/instructions/mod.rs');
  const idl = await readJson('programs/susu/idl/susu.json');
  const instruction = (idl.instructions ?? []).find((item) => item.name === 'cancel_group');

  assert.match(lib, /\bcancel_group::CancelGroup\b/, 'lib.rs must import CancelGroup accounts');
  assert.match(modules, /\bpub\s+mod\s+cancel_group\s*;/, 'instructions/mod.rs must expose cancel_group');
  assert.match(
    lib,
    /pub\s+fn\s+cancel_group\s*\(\s*ctx\s*:\s*Context\s*<\s*CancelGroup\s*>\s*,\s*group_id\s*:\s*u64\s*,?\s*\)\s*->\s*Result\s*<\s*\(\)\s*>/s,
    'program module must expose cancel_group(ctx, group_id: u64)',
  );
  assert.match(lib, /instructions::cancel_group::handler\s*\(\s*ctx\s*,\s*group_id\s*\)/, 'program handler must delegate to instructions::cancel_group::handler');

  assert.ok(instruction, 'IDL must expose cancel_group');
  assert.deepEqual(
    (instruction.accounts ?? []).map((account) => account.name),
    ['creator', 'group'],
    'IDL cancel_group accounts must be creator and group',
  );
  assert.deepEqual(
    (instruction.args ?? []).map((arg) => [arg.name, arg.type]),
    [['group_id', 'u64']],
    'IDL cancel_group args must be group_id: u64',
  );
});

test('[P0] cancel_group account constraints enforce creator-only access to the Group PDA', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/cancel_group.rs');
  const normalized = compact(source);

  assert.match(source, /use\s+crate::error::SusuError\b/, 'handler must use canonical SusuError variants');
  assert.match(source, /use\s+crate::seeds::GROUP_SEED\b/, 'Accounts seeds must use GROUP_SEED from seeds.rs');
  assert.match(source, /use\s+crate::state::\{[^}]*Group[^}]*GroupStatus[^}]*\}/s, 'handler must use Group and GroupStatus');
  assert.match(source, /#\[\s*derive\s*\(\s*Accounts\s*\)\s*\]/, 'CancelGroup must derive Accounts');
  assert.match(source, /pub\s+struct\s+CancelGroup\s*<\s*'info\s*>/, 'CancelGroup accounts struct must be lifetime-scoped');
  assert.match(source, /creator\s*:\s*Signer\s*<\s*'info\s*>/, 'creator must be a signer');
  assert.match(source, /group\s*:\s*Account\s*<\s*'info\s*,\s*Group\s*>/, 'group must be an Anchor Group account');
  assert.match(source, /#\[\s*account\s*\([\s\S]*\bmut\b[\s\S]*\bhas_one\s*=\s*creator[\s\S]*\)\s*\]\s*pub\s+group\s*:/, 'group account must be mutable and has_one creator');
  assert.ok(
    normalized.includes('seeds=[GROUP_SEED,creator.key().as_ref(),group.group_id.to_le_bytes().as_ref()]'),
    'Group PDA seeds must be [GROUP_SEED, creator, group.group_id]',
  );
  assert.match(source, /\bbump\s*=\s*group\.bump\b/, 'Group PDA constraint must include bump = group.bump');
  assert.doesNotMatch(source, /\b(init|init_if_needed|realloc|close|payer\s*=|space\s*=|system_program)\b/, 'cancel_group must mutate an existing Group only');
});

test('[P0] cancel_group validates Forming then persists Cancelled status', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/cancel_group.rs');
  const normalized = compact(source);

  assert.match(
    source,
    /pub\s+fn\s+handler\s*\(\s*ctx\s*:\s*Context\s*<\s*CancelGroup\s*>\s*,\s*group_id\s*:\s*u64\s*,?\s*\)\s*->\s*Result\s*<\s*\(\)\s*>/s,
    'handler signature must accept group_id: u64',
  );
  assert.ok(
    normalized.includes('require!(group.status==GroupStatus::Forming,SusuError::GroupAlreadyStarted)'),
    'non-Forming groups must return GroupAlreadyStarted',
  );
  assert.ok(
    normalized.includes('group.status=GroupStatus::Cancelled;'),
    'cancel_group must persist GroupStatus::Cancelled',
  );
  assertSourceOrder(
    normalized,
    'require!(group.status==GroupStatus::Forming,SusuError::GroupAlreadyStarted)',
    'group.status=GroupStatus::Cancelled;',
    'status validation must run before cancellation mutation',
  );
  assertSourceOrder(
    normalized,
    'group.status=GroupStatus::Cancelled;',
    'Ok(())',
    'cancel_group must persist status before returning success',
  );
  assert.ok(
    normalized.includes('letgroup=&mutctx.accounts.group;') ||
      normalized.includes('letmutgroup=ctx.accounts.group'),
    'handler must mutate ctx.accounts.group directly',
  );
});

test('[P0] cancel_group rejects all non-Forming states with the selected error', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/cancel_group.rs');
  const story = await readRepoFile('tests/atdd/story-2.5-cancel-group.atdd.md');
  const normalized = compact(source);

  assert.ok(
    normalized.includes('GroupStatus::Forming'),
    'the single allowed pre-cancel status must be Forming',
  );
  assert.ok(
    normalized.includes('SusuError::GroupAlreadyStarted'),
    're-cancel, Active, and Completed cases must use the selected GroupAlreadyStarted error',
  );
  assert.doesNotMatch(source, /SusuError::GroupCancelled/, 'Story 2.5 selects GroupAlreadyStarted rather than GroupCancelled for re-cancel');
  assert.match(story, /Active.*Completed.*Runtime Fixture Gap/s, 'ATDD handoff must document Active/Completed runtime fixture coverage gap');
});

test('[P1] cancel_group emits group_cancelled and remains metadata-only', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/cancel_group.rs');

  assert.match(
    source,
    /msg!\s*\(\s*"group_cancelled\s+group_pda=\{\}\s+creator=\{\}"\s*,\s*group\.key\(\)\s*,\s*ctx\.accounts\.creator\.key\(\)\s*\)/s,
    'successful cancel must emit group_cancelled group_pda={} creator={}',
  );
});

test('[P0] cancel_group has no token movement, custody, refund, fee, or yield logic', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/cancel_group.rs');
  const lower = source.toLowerCase();

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
    'refund',
    'withdraw',
    'collateral_posted',
    'fee',
    'yield',
  ]) {
    assert.ok(!lower.includes(forbidden), `cancel_group must not introduce ${forbidden} behavior`);
  }

  assert.doesNotMatch(source, /\bMemberPosition\b/, 'cancel_group must not mutate MemberPosition accounts');
  assert.doesNotMatch(source, /\bRotationReceipt\b/, 'cancel_group must not touch payout receipt state');

  for (const file of await listRustFiles('programs/susu/src')) {
    if (file === 'programs/susu/src/seeds.rs') {
      continue;
    }
    const rust = await readRepoFile(file);
    assert.doesNotMatch(rust, /b"group"/, `${file} must not inline the group seed literal`);
  }
});
