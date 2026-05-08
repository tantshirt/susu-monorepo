import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const repoRoot = new URL('../../', import.meta.url);
const repoRootPath = fileURLToPath(repoRoot);
const execFileAsync = promisify(execFile);

const expectedErrors = [
  'GroupFull',
  'GroupAlreadyStarted',
  'MemberNotInvited',
  'InvalidMemberCount',
  'MintNotSupported',
  'GroupCancelled',
  'AlreadyAccepted',
];

async function readRepoFile(path) {
  return readFile(new URL(path, repoRoot), 'utf8');
}

async function readJson(path) {
  return JSON.parse(await readRepoFile(path));
}

async function runRepoCommand(command, args) {
  try {
    await execFileAsync(command, args, {
      cwd: repoRootPath,
      env: process.env,
      maxBuffer: 16 * 1024 * 1024,
      timeout: 120_000,
    });
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join('\n');
    assert.fail(`${command} ${args.join(' ')} failed\n${output}`);
  }
}

function assertRustField(source, name, typePattern) {
  const pattern = new RegExp(`pub\\s+${name}\\s*:\\s*${typePattern}\\s*,`);
  assert.match(source, pattern, `expected Rust field ${name}: ${typePattern}`);
}

function findIdlType(idl, name) {
  const idlType = (idl.types ?? []).find((type) => type.name === name);
  assert.ok(idlType, `IDL must define type ${name}`);
  return idlType;
}

function normalizeIdlType(type) {
  if (typeof type === 'string') {
    return type;
  }
  if (type?.defined?.name) {
    return type.defined.name;
  }
  if (type?.vec) {
    return `Vec<${normalizeIdlType(type.vec)}>`;
  }
  return JSON.stringify(type);
}

function assertIdlStructFields(idl, name, expectedFields) {
  const idlType = findIdlType(idl, name);
  assert.equal(idlType.type?.kind, 'struct', `IDL ${name} must be a struct`);
  const actualFields = (idlType.type.fields ?? []).map((field) => [field.name, normalizeIdlType(field.type)]);
  assert.deepEqual(actualFields, expectedFields, `IDL ${name} fields must match Story 2.1 shape`);
}

function assertIdlEnumVariants(idl, name, expectedVariants) {
  const idlType = findIdlType(idl, name);
  assert.equal(idlType.type?.kind, 'enum', `IDL ${name} must be an enum`);
  const actualVariants = (idlType.type.variants ?? []).map((variant) => variant.name);
  assert.deepEqual(actualVariants, expectedVariants, `IDL ${name} variants must match Story 2.1 shape`);
}

function assertIdlInstructionArgs(idl, name, expectedArgs) {
  const instruction = (idl.instructions ?? []).find((item) => item.name === name);
  assert.ok(instruction, `IDL must define instruction ${name}`);
  const actualArgs = (instruction.args ?? []).map((arg) => [arg.name, normalizeIdlType(arg.type)]);
  assert.deepEqual(actualArgs, expectedArgs, `IDL ${name} args must match the current persisted instruction contract`);
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

test('[P0] Group account locks the Story 2.1 state shape', async () => {
  const source = await readRepoFile('programs/susu/src/state/group.rs');

  assert.match(source, /#\[account\]/);
  assert.match(source, /InitSpace/, 'Group should use Anchor InitSpace derivation');
  assert.match(source, /pub\s+struct\s+Group\b/);
  assertRustField(source, 'mint', 'Pubkey');
  assertRustField(source, 'contribution_amount', 'u64');
  assertRustField(source, 'contribution_period', 'i64');
  assertRustField(source, 'n', 'u8');
  assertRustField(source, 'curve_params', 'CurveParams');
  assertRustField(source, 'members', 'Vec\\s*<\\s*MemberSlot\\s*>');
  assertRustField(source, 'status', 'GroupStatus');
  assertRustField(source, 'created_at', 'i64');
  assertRustField(source, 'creator', 'Pubkey');
  assertRustField(source, 'group_id', 'u64');
  assertRustField(source, 'bump', 'u8');
  assertRustField(source, 'start_timestamp', 'i64');
  assertRustField(source, 'contribution_window_duration', 'i64');
  assertRustField(source, 'slash_grace_seconds', 'i64');

  for (const variant of ['Forming', 'Active', 'Cancelled', 'Completed']) {
    assert.match(source, new RegExp(`\\b${variant}\\b`), `missing GroupStatus.${variant}`);
  }

  assert.match(source, /pub\s+struct\s+MemberSlot\b/);
  assertRustField(source, 'pubkey', 'Pubkey');
  assertRustField(source, 'accepted', 'bool');
  assert.match(source, /pub\s+struct\s+CurveParams\b/);
});

test('[P0] MemberPosition account locks PDA-owned member state shape', async () => {
  const source = await readRepoFile('programs/susu/src/state/member_position.rs');

  assert.match(source, /#\[account\]/);
  assert.match(source, /InitSpace/, 'MemberPosition should use Anchor InitSpace derivation');
  assert.match(source, /MEMBER_SEED/, 'MemberPosition PDA seed source should reference MEMBER_SEED');
  assert.match(source, /pub\s+struct\s+MemberPosition\b/);
  assertRustField(source, 'group', 'Pubkey');
  assertRustField(source, 'member_pubkey', 'Pubkey');
  assertRustField(source, 'rotation_slot', 'u8');
  assert.match(source, /u8::MAX/, 'rotation_slot placeholder behavior must be documented');
  assertRustField(source, 'contribution_history', 'Vec\\s*<\\s*ContributionRecord\\s*>');
  assertRustField(source, 'collateral_posted', 'u64');
  assertRustField(source, 'slash_status', 'SlashStatus');
  assert.match(source, /pub\s+struct\s+ContributionRecord\b/);
  assertRustField(source, 'rotation_index', 'u8');
  assertRustField(source, 'amount', 'u64');
  assertRustField(source, 'paid_at', 'i64');

  for (const variant of ['None', 'Slashed', 'Refunded']) {
    assert.match(source, new RegExp(`\\b${variant}\\b`), `missing SlashStatus.${variant}`);
  }
});

test('[P0] RotationReceipt account is an existence-as-flag double-claim guard', async () => {
  const source = await readRepoFile('programs/susu/src/state/rotation_receipt.rs');

  assert.match(source, /#\[account\]/);
  assert.match(source, /InitSpace/, 'RotationReceipt should use Anchor InitSpace derivation');
  assert.match(source, /ROTATION_SEED/, 'RotationReceipt PDA seed source should reference ROTATION_SEED');
  assert.match(source, /pub\s+struct\s+RotationReceipt\b/);
  assertRustField(source, 'group', 'Pubkey');
  assertRustField(source, 'rotation_index', 'u8');
  assertRustField(source, 'amount', 'u64');
  assertRustField(source, 'recipient', 'Pubkey');
  assertRustField(source, 'claimed_at', 'i64');
  assert.doesNotMatch(source, /\bsignature\s*:/, 'RotationReceipt must not store transaction signatures');
});

test('[P0] Vec fields are bounded and source has no realloc attack surface', async () => {
  const group = await readRepoFile('programs/susu/src/state/group.rs');
  const memberPosition = await readRepoFile('programs/susu/src/state/member_position.rs');

  assert.match(
    group,
    /#\[max_len\s*\(\s*12\s*\)\][\s\S]{0,160}pub\s+members\s*:\s*Vec\s*<\s*MemberSlot\s*>/,
    'Group.members must be bounded with #[max_len(12)]',
  );
  assert.match(
    memberPosition,
    /#\[max_len\s*\(\s*12\s*\)\][\s\S]{0,160}pub\s+contribution_history\s*:\s*Vec\s*<\s*ContributionRecord\s*>/,
    'MemberPosition.contribution_history must be bounded with #[max_len(12)]',
  );

  for (const file of await listRustFiles('programs/susu/src')) {
    const source = await readRepoFile(file);
    assert.doesNotMatch(source, /\bAccountInfo::realloc\b|\brealloc\s*=\s*true\b|\.realloc\s*\(/, `${file} must not use realloc`);
  }
});

test('[P0] SusuError declares canonical variants with Anchor messages', async () => {
  const source = await readRepoFile('programs/susu/src/error.rs');

  assert.match(source, /#\[error_code\]\s*pub\s+enum\s+SusuError\b/);
  for (const variant of expectedErrors) {
    assert.match(
      source,
      new RegExp(`#\\[msg\\s*\\(\\s*"[^"]+"\\s*\\)\\]\\s*${variant}\\b`),
      `SusuError.${variant} must exist with #[msg("...")]`,
    );
  }
  assert.doesNotMatch(source, /\bUnimplemented\b/, 'placeholder error variants should be removed');
});

test('[P1] English i18n messages cover every SusuError with recovery hints', async () => {
  const messages = await readJson('apps/reference/messages/en.json');
  assert.equal(typeof messages.errors, 'object', 'en.json must expose an errors object');

  for (const variant of expectedErrors) {
    const value = messages.errors?.[variant];
    assert.equal(typeof value, 'string', `errors.${variant} must be a string`);
    assert.ok(value.length >= 40, `errors.${variant} should include user-facing recovery detail`);
    assert.match(
      value,
      /\b(try|check|choose|select|use|wait|invite|start|create|contact|retry|supported|cancelled|accepted)\b/i,
      `errors.${variant} should include a recovery hint, not only a label`,
    );
  }
});

test('[P1] PDA seed literals stay centralized in seeds.rs', async () => {
  for (const file of await listRustFiles('programs/susu/src')) {
    if (file === 'programs/susu/src/seeds.rs') {
      continue;
    }

    const source = await readRepoFile(file);
    assert.doesNotMatch(source, /b"(group|member|vault|rotation)"/, `${file} must import seed constants instead of inline byte literals`);
  }
});

test('[P0] IDL exposes Story 2.1 surface while retaining frozen hash behavior', async () => {
  const idlRaw = await readRepoFile('programs/susu/idl/susu.json');
  const freeze = await readRepoFile('IDL_FREEZE.md');
  const engineeringLog = await readRepoFile('log/2026-05-07.md');
  const idl = JSON.parse(idlRaw);

  assert.equal(idl.address, '2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N');

  const accountNames = new Set((idl.accounts ?? []).map((account) => account.name));
  for (const accountName of ['Group', 'MemberPosition', 'RotationReceipt']) {
    assert.ok(accountNames.has(accountName), `IDL must expose ${accountName}`);
  }

  const idlErrorNames = new Set((idl.errors ?? []).map((error) => error.name));
  for (const variant of expectedErrors) {
    assert.ok(idlErrorNames.has(variant), `IDL must expose SusuError.${variant}`);
  }

  assertIdlInstructionArgs(idl, 'create_group', [
    ['group_id', 'u64'],
    ['n', 'u8'],
    ['contribution_amount', 'u64'],
    ['contribution_period', 'i64'],
    ['mint', 'pubkey'],
    ['curve_params', 'CurveParams'],
  ]);

  const expectedHash = freeze.match(/[a-f0-9]{64}/)?.[0];
  assert.ok(expectedHash, 'IDL_FREEZE.md must contain a SHA-256 hash');
  const actualHash = createHash('sha256').update(idlRaw).digest('hex');
  assert.equal(actualHash, expectedHash, 'regenerated IDL must still match the frozen preflight hash');
  assert.match(
    engineeringLog,
    new RegExp(actualHash),
    'IDL hash updates must have a public engineering-log justification',
  );
});

test('[P0] IDL account type definitions match Story 2.1 account shapes', async () => {
  const idl = await readJson('programs/susu/idl/susu.json');

  assertIdlStructFields(idl, 'Group', [
    ['mint', 'pubkey'],
    ['contribution_amount', 'u64'],
    ['contribution_period', 'i64'],
    ['n', 'u8'],
    ['curve_params', 'CurveParams'],
    ['members', 'Vec<MemberSlot>'],
    ['status', 'GroupStatus'],
    ['created_at', 'i64'],
    ['creator', 'pubkey'],
    ['group_id', 'u64'],
    ['bump', 'u8'],
    ['start_timestamp', 'i64'],
    ['contribution_window_duration', 'i64'],
    ['slash_grace_seconds', 'i64'],
  ]);
  assertIdlStructFields(idl, 'MemberSlot', [
    ['pubkey', 'pubkey'],
    ['accepted', 'bool'],
  ]);
  assertIdlStructFields(idl, 'CurveParams', []);
  assertIdlEnumVariants(idl, 'GroupStatus', ['Forming', 'Active', 'Cancelled', 'Completed']);

  assertIdlStructFields(idl, 'MemberPosition', [
    ['group', 'pubkey'],
    ['member_pubkey', 'pubkey'],
    ['rotation_slot', 'u8'],
    ['contribution_history', 'Vec<ContributionRecord>'],
    ['collateral_posted', 'u64'],
    ['slash_status', 'SlashStatus'],
  ]);
  assertIdlStructFields(idl, 'ContributionRecord', [
    ['rotation_index', 'u8'],
    ['amount', 'u64'],
    ['paid_at', 'i64'],
  ]);
  assertIdlEnumVariants(idl, 'SlashStatus', ['None', 'Slashed', 'Refunded']);

  assertIdlStructFields(idl, 'RotationReceipt', [
    ['group', 'pubkey'],
    ['rotation_index', 'u8'],
    ['amount', 'u64'],
    ['recipient', 'pubkey'],
    ['claimed_at', 'i64'],
  ]);
});

test('[P1] Story 2.1 parity scripts stay green for i18n, seeds, and generated SDKs', async () => {
  await runRepoCommand(process.execPath, ['scripts/check-i18n-parity.ts']);
  await runRepoCommand('bash', ['scripts/check-patterns.sh']);
  await runRepoCommand('bash', ['scripts/check-sdk-parity.sh']);
});
