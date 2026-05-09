import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const repoRoot = new URL('../../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, repoRoot), 'utf8');
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: new URL('.', repoRoot),
    encoding: 'utf8',
    ...options,
  });
}

function writeFixture(filePath, source) {
  mkdirSync(join(filePath, '..'), { recursive: true });
  writeFileSync(filePath, source);
}

test('Story 6.5 owns a non-vacuous SDK parity checker wired to codegen, drift detection, and surface diff', () => {
  for (const path of [
    'scripts/check-sdk-parity.sh',
    'scripts/extract-ts-surface.mjs',
    'scripts/compare-sdk-surfaces.mjs',
    'crates/extract-rust-surface/Cargo.toml',
    'crates/extract-rust-surface/src/main.rs',
    'docs/codama-rust-status.md',
  ]) {
    assert.equal(existsSync(new URL(path, repoRoot)), true, `${path} must exist`);
  }

  const checker = read('scripts/check-sdk-parity.sh');
  assert.match(checker, /pnpm sdk:codegen/, 'checker must regenerate with pnpm sdk:codegen');
  assert.match(checker, /git diff --exit-code/, 'checker must fail on generated drift');
  assert.match(checker, /extract-ts-surface\.mjs/, 'checker must invoke the TypeScript surface extractor');
  assert.match(checker, /cargo run -p extract-rust-surface/, 'checker must invoke the Rust extractor via Cargo');
  assert.match(checker, /compare-sdk-surfaces\.mjs/, 'checker must invoke structural surface compare');
  assert.match(checker, /SusuInstructionKind|camelCase/i, 'checker describes instruction kind normalization');
  assert.doesNotMatch(checker, /vacuously passing/, 'checker must not pass when Rust generated output is absent');
});

test('Story 6.5 TypeScript extractor reads generated instruction, account, and error names', () => {
  const root = mkdtempSync(join(tmpdir(), 'susu-ts-surface-'));
  try {
    writeFixture(join(root, 'instructions', 'createGroup.ts'), 'export function createGroup() {}\n');
    writeFixture(join(root, 'instructions', 'index.ts'), 'export * from "./createGroup.js";\n');
    writeFixture(join(root, 'accounts', 'Group.ts'), 'export type Group = Readonly<{ raw: Uint8Array }>;\n');
    writeFixture(join(root, 'errors', 'SusuError.ts'), 'export enum SusuError {\n  GroupFull = "GroupFull",\n}\n');

    const result = run('node', ['scripts/extract-ts-surface.mjs', root]);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      instructions: ['createGroup'],
      accounts: ['Group'],
      errors: ['GroupFull'],
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Story 6.5 Rust extractor maps SusuInstructionKind variants to TS camelCase names', () => {
  const root = mkdtempSync(join(tmpdir(), 'susu-rust-surface-'));
  try {
    writeFixture(
      join(root, 'instructions.rs'),
      [
        'pub enum SusuInstructionKind {',
        '    CreateGroup,',
        '}',
        'pub fn create_group() -> SusuInstructionKind { SusuInstructionKind::CreateGroup }',
      ].join('\n'),
    );
    writeFixture(join(root, 'accounts.rs'), '#[derive(Debug)]\npub struct Group;\n');
    writeFixture(join(root, 'errors.rs'), 'pub enum SusuError {\n    GroupFull,\n}\n');

    const result = run('cargo', ['run', '-p', 'extract-rust-surface', '--quiet', '--', root]);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      instructions: ['createGroup'],
      accounts: ['Group'],
      errors: ['GroupFull'],
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Story 6.5 compare script detects surface mismatch', () => {
  const a = mkdtempSync(join(tmpdir(), 'susu-surf-a-'));
  const b = mkdtempSync(join(tmpdir(), 'susu-surf-b-'));
  try {
    writeFixture(join(a, 'x.json'), JSON.stringify({ instructions: ['a'], accounts: [], errors: [] }));
    writeFixture(join(b, 'x.json'), JSON.stringify({ instructions: ['b'], accounts: [], errors: [] }));
    const result = run('node', ['scripts/compare-sdk-surfaces.mjs', join(a, 'x.json'), join(b, 'x.json')]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SDK surface mismatch/);
  } finally {
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  }
});

test('Story 6.5 checker passes against the checked-in generated SDK surface', () => {
  const result = run('bash', ['scripts/check-sdk-parity.sh']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /check-sdk-parity: OK/);
});
