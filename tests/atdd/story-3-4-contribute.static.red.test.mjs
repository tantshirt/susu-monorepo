import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const repoRoot = new URL('../../', import.meta.url);

async function readRepoFile(path) {
  return readFile(new URL(path, repoRoot), 'utf8');
}

async function readJson(path) {
  return JSON.parse(await readRepoFile(path));
}

function compact(source) {
  return source.replace(/\s+/g, '');
}

test('[P0] contribute is wired into the Anchor program entrypoint', async () => {
  const lib = await readRepoFile('programs/susu/src/lib.rs');
  const modules = await readRepoFile('programs/susu/src/instructions/mod.rs');
  const idl = await readJson('programs/susu/idl/susu.json');
  const instruction = (idl.instructions ?? []).find((item) => item.name === 'contribute');

  assert.match(lib, /\bcontribute::Contribute\b/, 'lib.rs must import Contribute accounts');
  assert.match(modules, /\bpub\s+mod\s+contribute\s*;/, 'instructions/mod.rs must expose contribute');
  assert.match(
    lib,
    /pub\s+fn\s+contribute\s*\(\s*ctx\s*:\s*Context\s*<\s*Contribute\s*>[\s\S]*group_id\s*:\s*u64[\s\S]*amount\s*:\s*u64[\s\S]*rotation_index\s*:\s*u8[\s\S]*\)\s*->\s*Result\s*<\s*\(\)\s*>/s,
    'program module must expose contribute(ctx, group_id, amount, rotation_index)',
  );
  assert.match(
    lib,
    /instructions::contribute::handler\s*\(\s*ctx\s*,\s*group_id\s*,\s*amount\s*,\s*rotation_index\s*\)/,
    'program handler must delegate to instructions::contribute::handler',
  );

  assert.ok(instruction, 'IDL must expose contribute');
  assert.deepEqual(
    (instruction.args ?? []).map((arg) => [arg.name, arg.type]),
    [
      ['group_id', 'u64'],
      ['amount', 'u64'],
      ['rotation_index', 'u8'],
    ],
    'IDL contribute args must stay group_id, amount, rotation_index',
  );
});

test('[P0] IDL contribute instruction must declare non-empty accounts for client generation', async () => {
  const idl = await readJson('programs/susu/idl/susu.json');
  const instruction = (idl.instructions ?? []).find((item) => item.name === 'contribute');

  assert.ok((instruction.accounts ?? []).length > 0, 'contribute IDL accounts must be populated after Story 3.4 account wiring');
});

test('[P0] SusuError defines contribution-specific variants for Story 3.4', async () => {
  const source = await readRepoFile('programs/susu/src/error.rs');

  for (const expected of [
    'ContributionAmountMismatch',
    'GroupNotActive',
    'MemberSlashedCannotContribute',
    'ContributionAlreadyRecorded',
    'InvalidContributionRotation',
  ]) {
    assert.match(
      source,
      new RegExp(`\\b${expected}\\s*,`),
      `SusuError must declare ${expected} for contributors`,
    );
  }
});

test('[P0] ContributionRecord persists rotation_index and amount for participation history', async () => {
  const source = await readRepoFile('programs/susu/src/state/member_position.rs');

  assert.match(source, /\bContributionRecord\b/, 'member_position must expose ContributionRecord');
  assert.match(
    source,
    /#\[\s*derive\s*\([^)]*InitSpace[^)]*\)\s*\]\s*pub\s+struct\s+ContributionRecord\s*\{[^}]*\brotation_index\s*:\s*u8[\s\S]*\bamount\s*:\s*u64/s,
    'ContributionRecord must include rotation_index u8 and amount u64 with InitSpace',
  );
});

test('[P0] contribute account struct wires group, signer, vault, SPL token interfaces', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/contribute.rs');

  assert.match(source, /use\s+crate::error::SusuError\b/, 'must import SusuError');
  assert.match(source, /use\s+crate::seeds::\{[^}]*GROUP_SEED[^}]*MEMBER_SEED[^}]*VAULT_SEED[^}]*\}/s, 'must import GROUP_SEED, MEMBER_SEED, VAULT_SEED bundle');
  assert.match(
    source,
    /anchor_spl\s*::\s*(token(::Program)?|associated_token\b|token_interface\b)/,
    'must use anchor_spl token or associated-token surface',
  );
  assert.match(source, /#\[\s*derive\s*\(\s*Accounts\s*\)\s*\]/s, 'Contribute must derive Accounts');
  assert.match(
    source,
    /#\[\s*instruction\s*\(\s*group_id[^)]*amount[^)]*rotation_index[^)]*\)\s*\]/s,
    'Contribute accounts must bind instruction args',
  );
  assert.match(source, /pub\s+struct\s+Contribute\s*<\s*'info\s*>/, 'Contribute must be lifetime-scoped Accounts struct');

  assert.match(source, /\bmember\s*:\s*Signer\s*<\s*'info\s*>/, 'member must sign');
  assert.match(source, /group\s*:\s*Account\s*<\s*'info\s*,\s*Group\s*>/, 'group must bind Group account');

  assert.match(
    source,
    /\b(member_position|position)\s*:\s*(Account\s*<\s*'info\s*,\s*MemberPosition\s*>|Box\s*<\s*Account\s*<\s*'info\s*,\s*MemberPosition\s*>\s*>)/,
    'must constrain MemberPosition PDA',
  );
  assert.match(
    source,
    /\b(Account\s*<\s*'info\s*,\s*Mint\s*>|Mint\s*<\s*'info\s*>|InterfaceAccount\s*<\s*'info\s*,\s*Mint\s*>)/,
    'mint account must enforce SPL mint interface',
  );
  assert.match(
    source,
    /(InterfaceAccount\s*<\s*'info\s*,\s*TokenAccount\s*>|Account\s*<\s*'info\s*,\s*TokenAccount\s*>)/,
    'must constrain SPL TokenAccount structs for vault and member ATA',
  );
  assert.match(source, /\btoken_program\s*:\s*(Program|Interface)\s*<\s*'info\s*,\s*(Token|Token2022)\s*>/, 'must wire Token / Token2022 program account');
  assert.match(
    source,
    /seeds\s*=\s*\[\s*VAULT_SEED[\s\S]*group\.key\(\)\.as_ref\(\)[\s\S]*\]/s,
    'vault PDA must bind VAULT_SEED with group key',
  );
});

test('[P0] contribute validates Group lifecycle before moving tokens', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/contribute.rs');
  const normalized = compact(source);

  assert.ok(source.includes('GroupStatus::Active'), 'handler must gate on Active status');
  assert.ok(
    normalized.includes('SusuError::GroupNotActive'),
    'non-Active groups must surface GroupNotActive',
  );

  const handlerBody = sliceAfterHandlerNormalized(normalized);
  assertSourceOrder(
    handlerBody,
    'GroupStatus::Active',
    'CpiContext',
    'Active status enforcement must precede CPI construction in handler body',
  );
});

test('[P0] contribute handler validates contribution rules before SPL CPI', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/contribute.rs');
  const normalized = compact(source);

  assert.ok(
    normalized.includes('contribution_amount') || normalized.includes('group.contribution_amount'),
    'must compare against group.contribution_amount',
  );
  assert.ok(
    normalized.includes('SusuError::ContributionAmountMismatch'),
    'wrong amount must map to ContributionAmountMismatch',
  );
  assert.ok(
    normalized.includes('SlashStatus') && normalized.includes('SusuError::MemberSlashedCannotContribute'),
    'slashed members must surface MemberSlashedCannotContribute',
  );
  assert.ok(
    normalized.includes('rotation_index') && normalized.includes('group.n'),
    'rotation_index must be bounded against group.n',
  );
  assert.ok(
    normalized.includes('SusuError::InvalidContributionRotation'),
    'invalid rotation must surface InvalidContributionRotation',
  );
  assert.ok(normalized.includes('SusuError::ContributionAlreadyRecorded'), 'duplicate rotations must surface ContributionAlreadyRecorded');
  assert.ok(
    normalized.includes('contribution_history'),
    'must mutate or consult contribution_history',
  );

  const handlerBody = sliceAfterHandlerNormalized(normalized);
  assertSourceOrder(
    handlerBody,
    'SusuError::ContributionAlreadyRecorded',
    'CpiContext',
    'duplicate contribution guard must run before CPI construction in handler body',
  );
});

test('[P0] contribute performs SPL transfer via Anchor CPI helpers', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/contribute.rs');

  assert.match(source, /\btransfer(_checked)?\s*\(/, 'must invoke SPL transfer or transfer_checked');
  assert.match(source, /\bCpiContext\s*::\s*new\b/, 'must construct Anchor CpiContext for SPL CPI');
  assert.match(
    source,
    /msg!\s*\(\s*"(member_)?contrib|contributed|contribution_/i,
    'successful path should emit observability msg!',
  );
});

function sliceAfterHandlerNormalized(normalizedCompactSource) {
  const marker = normalizedCompactSource.indexOf('pubfnhandler');
  assert.notEqual(marker, -1, 'contribute.rs must define pub fn handler');
  let openBrace = normalizedCompactSource.indexOf('{', marker);
  assert.notEqual(openBrace, -1, 'handler must open with {');
  let depth = 0;
  for (let i = openBrace; i < normalizedCompactSource.length; i++) {
    const c = normalizedCompactSource[i];
    if (c === '{') depth += 1;
    if (c === '}') {
      depth -= 1;
      if (depth === 0) return normalizedCompactSource.slice(openBrace, i + 1);
    }
  }
  assert.fail('handler function appears to have unmatched braces');
}

function assertSourceOrder(normalized, earlierMarker, laterMarker, message) {
  const earlierIndex = normalized.includes(earlierMarker) ? normalized.indexOf(earlierMarker) : -1;
  const laterIndex = normalized.includes(laterMarker) ? normalized.indexOf(laterMarker) : -1;

  assert.notEqual(earlierIndex, -1, `missing earlier marker substring: ${earlierMarker}`);
  assert.notEqual(laterIndex, -1, `missing later marker substring: ${laterMarker}`);
  assert.ok(earlierIndex < laterIndex, message);
}
