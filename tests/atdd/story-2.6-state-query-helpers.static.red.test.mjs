import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const repoRoot = new URL('../../', import.meta.url);

async function readRepoFile(path) {
  return readFile(new URL(path, repoRoot), 'utf8');
}

async function assertFileExists(path) {
  await access(new URL(path, repoRoot));
}

function compact(source) {
  return source.replace(/\s+/g, '');
}

test('[P0] TS query-helper mock RPC scaffold covers the Story 2.6 acceptance surface', async () => {
  const source = await readRepoFile('sdk/ts/tests/queries.test.ts');
  const packageJson = JSON.parse(await readRepoFile('sdk/ts/package.json'));

  for (const expected of [
    'getGroup returns decoded Group when account exists',
    'getGroup returns undefined when account does not exist',
    'getGroupByCreator derives the Group PDA from generated seed constants',
    'getMemberPosition returns decoded MemberPosition and undefined when missing',
    'queryParticipationHistory uses a MemberPosition.member_pubkey memcmp filter at offset 40',
    'createMockRpc',
    'getAccountInfo',
    'getProgramAccounts',
    'getGroupDecoder',
    'getMemberPositionDecoder',
  ]) {
    assert.match(source, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `TS ATDD scaffold must include ${expected}`);
  }

  assert.doesNotMatch(source, /devnet|mainnet|helius|http:\/\/|https:\/\//i, 'ATDD unit tests must not call live RPC endpoints');
  assert.doesNotMatch(source, /deserialize|borsh|Buffer\.from\("group"\)|Buffer\.from\("member"\)/i, 'ATDD tests must not encourage hand-rolled Borsh or inline seed literals');
  assert.match(packageJson.scripts?.test ?? '', /\bvitest\s+run\b/, 'sdk/ts pnpm test must run Vitest');
  assert.ok(packageJson.devDependencies?.vitest, 'sdk/ts must declare Vitest for query unit tests');
});

test('[P0] TS query helpers expose getGroup, getGroupByCreator, getMemberPosition, and queryParticipationHistory', async () => {
  await assertFileExists('sdk/ts/src/helpers/queries.ts');
  const source = await readRepoFile('sdk/ts/src/helpers/queries.ts');

  for (const expected of [
    'export async function getGroup',
    'export async function getGroupByCreator',
    'export async function getMemberPosition',
    'export async function queryParticipationHistory',
  ]) {
    assert.match(source, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `queries.ts must define ${expected}`);
  }

  assert.match(source, /\bAddress\b/, 'helper signatures must use @solana/kit Address types');
  assert.match(source, /\b(getGroupDecoder|decodeGroup)\b/, 'getGroup must use Codama-generated Group decoder');
  assert.match(source, /\b(getMemberPositionDecoder|decodeMemberPosition)\b/, 'member helpers must use Codama-generated MemberPosition decoder');
  assert.match(source, /\bGROUP_SEED(_BYTES)?\b/, 'Group PDA derivation must use generated GROUP_SEED constants');
  assert.match(source, /\bMEMBER_SEED(_BYTES)?\b/, 'MemberPosition PDA derivation must use generated MEMBER_SEED constants');
  assert.doesNotMatch(source, /Buffer\.from\("group"\)|Buffer\.from\("member"\)|borsh|deserialize/i, 'helpers must not inline seed literals or hand-roll Borsh decoding');
});

test('[P0] TS missing-account semantics return undefined instead of null or throw', async () => {
  const source = await readRepoFile('sdk/ts/src/helpers/queries.ts');
  const normalized = compact(source);

  assert.match(source, /Promise\s*<\s*Group\s*\|\s*undefined\s*>/, 'getGroup must return Promise<Group | undefined>');
  assert.match(source, /Promise\s*<\s*MemberPosition\s*\|\s*undefined\s*>/, 'getMemberPosition must return Promise<MemberPosition | undefined>');
  assert.ok(
    /returnundefined;/.test(normalized) || /returnvoid0;/.test(normalized),
    'missing accounts must return undefined',
  );
  assert.doesNotMatch(source, /return\s+null\b/, 'missing accounts must not return null');
  assert.doesNotMatch(source, /throw\s+new\s+Error\s*\([^)]*not found/i, 'missing accounts must not throw not-found errors');
});

test('[P0] queryParticipationHistory uses getProgramAccounts with member_pubkey memcmp offset 40', async () => {
  const source = await readRepoFile('sdk/ts/src/helpers/queries.ts');

  assert.match(source, /\bgetProgramAccounts\b/, 'queryParticipationHistory must use getProgramAccounts');
  assert.match(source, /\bmemcmp\b/, 'queryParticipationHistory must use a memcmp filter');
  assert.match(source, /\boffset\s*:\s*40\b|\bMEMBER_PUBKEY_MEMCMP_OFFSET\s*=\s*40\b/, 'MemberPosition.member_pubkey memcmp offset must be 40');
  assert.match(source, /\brotationSlot\b/, 'ParticipationRecord must expose rotationSlot');
  assert.match(source, /\bcontributions\b/, 'ParticipationRecord must expose contributions');
  assert.match(source, /\bslashed\b/, 'ParticipationRecord must expose slashed');
  assert.match(source, /\bcompleted\b/, 'ParticipationRecord must expose completed');
});

test('[P0] TS SDK exports query helpers and keeps SDK boundary clean', async () => {
  const index = await readRepoFile('sdk/ts/src/index.ts');
  const helper = await readRepoFile('sdk/ts/src/helpers/queries.ts');

  assert.match(index, /helpers\/queries\.js/, 'sdk/ts/src/index.ts must re-export helper queries');
  assert.doesNotMatch(`${index}\n${helper}`, /@solana\/web3\.js|convex|privy|helius/i, 'SDK helpers must not import web3.js v1 directly or app/indexer concerns');
});

test('[P0] Rust SDK records query-helper parity tests without live RPC', async () => {
  await assertFileExists('sdk/rust/src/queries.rs');
  const source = await readRepoFile('sdk/rust/src/queries.rs');
  const lib = await readRepoFile('sdk/rust/src/lib.rs');

  for (const expected of [
    'pub async fn get_group',
    'pub async fn get_group_by_creator',
    'pub async fn get_member_position',
    'pub async fn query_participation_history',
    'ParticipationRecord',
    '#[cfg(test)]',
    'get_group_returns_none_when_account_missing',
    'query_participation_history_uses_member_pubkey_memcmp_offset_40',
  ]) {
    assert.match(source, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Rust query parity surface must include ${expected}`);
  }

  assert.match(source, /Option\s*<\s*Group\s*>/, 'Rust get_group must return Option<Group>');
  assert.match(source, /Option\s*<\s*MemberPosition\s*>/, 'Rust get_member_position must return Option<MemberPosition>');
  assert.match(source, /\bGROUP_SEED\b/, 'Rust Group PDA derivation must use generated GROUP_SEED');
  assert.match(source, /\bMEMBER_SEED\b/, 'Rust MemberPosition PDA derivation must use generated MEMBER_SEED');
  assert.match(lib, /pub\s+mod\s+queries\s*;/, 'sdk/rust/src/lib.rs must re-export the query module');
  assert.doesNotMatch(source, /devnet|mainnet|http:\/\/|https:\/\/|try_from_slice|borsh/i, 'Rust unit tests must avoid live RPC and hand-rolled Borsh');
});
