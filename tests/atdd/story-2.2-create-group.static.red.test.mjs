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

function removeWhitespace(source) {
  return source.replace(/\s+/g, '');
}

function assertMatch(source, pattern, message) {
  assert.match(source, pattern, message);
}

test('[P0] create_group account constraints derive the deterministic creator-scoped Group PDA', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/create_group.rs');
  const compact = removeWhitespace(source);

  assertMatch(source, /\bGROUP_SEED\b/, 'create_group must import/use GROUP_SEED from seeds.rs');
  assertMatch(source, /creator\s*:\s*Signer\s*<\s*'info\s*>/, 'creator must be the signing rent payer');
  assertMatch(source, /system_program\s*:\s*Program\s*<\s*'info\s*,\s*System\s*>/, 'Anchor init requires system_program');
  assertMatch(source, /#\[\s*account\s*\([\s\S]*\binit\b[\s\S]*\)\s*\]\s*pub\s+group\s*:\s*Account\s*<\s*'info\s*,\s*Group\s*>/, 'group must be initialized by Anchor');
  assert.doesNotMatch(source, /\binit_if_needed\b/, 'duplicate create must fail through Anchor init, not init_if_needed');
  assert.ok(compact.includes('seeds=[GROUP_SEED,creator.key().as_ref(),group_id.to_le_bytes().as_ref()]'), 'Group PDA seeds must be [GROUP_SEED, creator, group_id]');
  assert.ok(compact.includes('bump'), 'Group PDA init must capture the bump');
  assert.ok(compact.includes('payer=creator'), 'creator must pay rent for the Group PDA');
  assert.ok(compact.includes('space=8+Group::INIT_SPACE'), 'Group PDA must allocate discriminator plus Group::INIT_SPACE');

  for (const file of await listRustFiles('programs/susu/src')) {
    if (file === 'programs/susu/src/seeds.rs') {
      continue;
    }
    const rust = await readRepoFile(file);
    assert.doesNotMatch(rust, /b"group"/, `${file} must not inline the group seed literal`);
  }
});

test('[P0] create_group validates n bounds and supported mints before initialization succeeds', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/create_group.rs');
  const compact = removeWhitespace(source);

  assertMatch(source, /use\s+crate::error::SusuError\b/, 'handler must use canonical SusuError variants');
  assertMatch(source, /use\s+crate::state::\{[^}]*CurveParams[^}]*Group[^}]*GroupStatus[^}]*\}/s, 'handler must use Group, GroupStatus, and CurveParams');
  assertMatch(source, /pub\s+fn\s+handler\s*\([^)]*group_id\s*:\s*u64[\s\S]*\bn\s*:\s*u8[\s\S]*contribution_amount\s*:\s*u64[\s\S]*contribution_period\s*:\s*i64[\s\S]*mint\s*:\s*Pubkey[\s\S]*curve_params\s*:\s*CurveParams[\s\S]*\)\s*->\s*Result\s*<\s*\(\)\s*>/, 'handler signature must accept Story 2.2 args, including n and curve_params');
  assert.ok(compact.includes('require!(n>=3&&n<=12,SusuError::InvalidMemberCount)'), 'n outside [3, 12] must return InvalidMemberCount');
  assert.ok(compact.includes('require!(constants::is_supported_mint(&mint),SusuError::MintNotSupported)'), 'unsupported mint must return MintNotSupported');
  assert.doesNotMatch(source, /\b(panic!|unwrap\s*\(|expect\s*\()/, 'instruction handler must avoid panic/unwrap/expect');
});

test('[P0] supported USDC and USDT allowlist is centralized in constants.rs', async () => {
  const source = await readRepoFile('programs/susu/src/constants.rs');
  const lib = await readRepoFile('programs/susu/src/lib.rs');

  assertMatch(lib, /pub\s+mod\s+constants\s*;/, 'lib.rs must expose constants module');
  for (const name of ['USDC_DEVNET', 'USDC_MAINNET', 'USDT_DEVNET', 'USDT_MAINNET']) {
    assertMatch(source, new RegExp(`pub\\s+const\\s+${name}\\s*:\\s*Pubkey\\s*=\\s*pubkey!\\s*\\(\\s*"[^"]+"\\s*\\)`), `${name} must be a Pubkey constant`);
  }
  assertMatch(source, /4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU/, 'USDC devnet mint must match the Story 2.2 canonical address');
  assertMatch(source, /EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/, 'USDC mainnet mint must match the Story 2.2 canonical address');
  assertMatch(source, /EiXDnrAg9ea2Q6vEPV7E5TpTU1vh41jcuZqKjU5Dc4ZF/, 'USDT devnet mint must match the Story 2.2 allowlist address');
  assertMatch(source, /Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/, 'USDT mainnet mint must match the Story 2.2 canonical address');
  assertMatch(source, /pub\s+fn\s+is_supported_mint\s*\(\s*mint\s*:\s*&Pubkey\s*\)\s*->\s*bool/, 'constants.rs must expose is_supported_mint');

  const compact = removeWhitespace(source);
  for (const name of ['USDC_DEVNET', 'USDC_MAINNET', 'USDT_DEVNET', 'USDT_MAINNET']) {
    assert.ok(compact.includes(`mint==&${name}`) || compact.includes(`*mint==${name}`), `is_supported_mint must allow ${name}`);
  }
  assert.doesNotMatch(source, /Pubkey::default\s*\(\)/, 'allowlist must not treat default Pubkey as supported');
});

test('[P0] create_group initializes exact Group fields and emits group_created audit log', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/create_group.rs');
  const compact = removeWhitespace(source);

  assert.ok(compact.includes('letgroup=&mutctx.accounts.group;') || compact.includes('letgroup=ctx.accounts.group.as_mut();'), 'handler must mutate ctx.accounts.group');
  assert.ok(compact.includes('group.mint=mint;'), 'Group.mint must decode to the requested supported mint');
  assert.ok(compact.includes('group.contribution_amount=contribution_amount;'), 'Group.contribution_amount must decode exactly');
  assert.ok(compact.includes('group.contribution_period=contribution_period;'), 'Group.contribution_period must decode exactly');
  assert.ok(compact.includes('group.n=n;'), 'Group.n must decode exactly');
  assert.ok(compact.includes('group.curve_params=curve_params;'), 'Group.curve_params must decode exactly');
  assert.ok(compact.includes('group.members=Vec::new();'), 'Group.members must start empty');
  assert.ok(compact.includes('group.status=GroupStatus::Forming;'), 'Group.status must start Forming');
  assert.ok(compact.includes('Clock::get()?.unix_timestamp'), 'Group.created_at must come from Clock::get()?.unix_timestamp');
  assert.ok(compact.includes('group.creator=ctx.accounts.creator.key();'), 'Group.creator must be the signer');
  assert.ok(compact.includes('group.group_id=group_id;'), 'Group.group_id must decode exactly');
  assert.ok(compact.includes('group.bump=ctx.bumps.group;'), 'Group bump must persist ctx.bumps.group');
  assert.ok(compact.includes('group.start_timestamp=group.created_at;'), 'Group.start_timestamp must bootstrap from creation time');
  assert.ok(compact.includes('group.contribution_window_duration=contribution_period;'), 'Group.contribution_window_duration must follow contribution_period');
  assert.ok(compact.includes('group.slash_grace_seconds=contribution_period;'), 'Group.slash_grace_seconds must default to contribution_period');
  assertMatch(source, /msg!\s*\(\s*"group_created[^"]*vault=\{\}"/s, 'handler must emit group_created audit log referencing the vault parameter');
});

test('[P0] create_group initializes the collateral vault TokenAccount scoped to Group PDA authority', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/create_group.rs');
  const compact = removeWhitespace(source);

  assertMatch(source, /use\s+anchor_spl::token::\{/, 'create_group must use anchor SPL token types for vault init');
  assertMatch(source, /pub\s+vault\s*:\s*Account\s*<\s*'info\s*,\s*TokenAccount\s*>/, 'vault must be an SPL TokenAccount');
  assertMatch(source, /VAULT_SEED/, 'vault seeds must derive from VAULT_SEED');
  assert.ok(compact.includes('token::mint=mint_account'), 'vault mint must bind to validated mint_account');
  assert.ok(compact.includes('token::authority=group'), 'vault authority must remain the Group PDA');
});

test('[P0] create_group does not perform token transfers or CPI beyond vault account init', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/create_group.rs');
  const lower = source.toLowerCase();

  for (const forbidden of [
    'transfer_checked',
    'transfer',
    'cpi',
    'invoke',
    'fee',
    'yield',
    'associated_token',
  ]) {
    assert.ok(!lower.includes(forbidden), `create_group must not introduce ${forbidden}`);
  }
});

test('[P0] IDL exposes the Story 2.2 + Epic 3.3 create_group account and argument contract', async () => {
  const idl = await readJson('programs/susu/idl/susu.json');
  const instruction = (idl.instructions ?? []).find((item) => item.name === 'create_group');

  assert.ok(instruction, 'IDL must expose create_group');
  assert.deepEqual(
    (instruction.accounts ?? []).map((account) => account.name),
    ['creator', 'group', 'mint_account', 'vault', 'token_program', 'system_program', 'rent'],
    'IDL create_group accounts must include vault + mint bindings from Story 3.3',
  );
  assert.deepEqual(
    (instruction.args ?? []).map((arg) => [arg.name, typeof arg.type === 'string' ? arg.type : arg.type?.defined?.name]),
    [
      ['group_id', 'u64'],
      ['n', 'u8'],
      ['contribution_amount', 'u64'],
      ['contribution_period', 'i64'],
      ['mint', 'pubkey'],
      ['curve_params', 'CurveParams'],
    ],
    'IDL create_group args must match the Story 2.2 public interface',
  );
});

test('[P1] LiteSVM acceptance coverage is present or intentionally blocked by this red test', async () => {
  const path = 'programs/susu/tests/happy_path.rs';
  await access(new URL(path, repoRoot));
  const source = await readRepoFile(path);

  for (const expected of [
    'test_create_group_happy_path',
    'test_create_group_invalid_n_zero',
    'test_create_group_invalid_n_too_small',
    'test_create_group_invalid_n_too_large',
    'test_create_group_unsupported_mint',
    'test_create_group_double_create_fails',
    'test_create_group_accepts_member_count_bounds',
    'test_create_group_accepts_all_allowlisted_mints',
    'test_create_group_rejects_default_pubkey_mint',
    'test_create_group_avoids_yield_fees_and_token_transfers',
  ]) {
    assertMatch(source, new RegExp(`fn\\s+${expected}\\b`), `${path} must cover ${expected}`);
  }

  for (const expected of [
    'InvalidMemberCount',
    'MintNotSupported',
    'AccountAlreadyInitialized',
    'group_created',
    'USDC_DEVNET',
    'USDC_MAINNET',
    'USDT_DEVNET',
    'USDT_MAINNET',
  ]) {
    assertMatch(source, new RegExp(`\\b${expected}\\b`), `${path} must assert ${expected}`);
  }
});
