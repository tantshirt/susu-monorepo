import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const repoRoot = new URL('../../', import.meta.url);

const requiredPaths = [
  'programs/susu',
  'sdk/ts',
  'sdk/rust',
  'apps/reference',
  'examples/with-squads',
  'examples/with-privy',
  'examples/with-token-extensions',
  'crates/susu-adversary',
  'tests/invariants',
  'tests/coverage',
  'audits/adversary',
  'docs',
  'log',
  'scripts',
  '.github/workflows',
  '.github/ISSUE_TEMPLATE',
];

test('[P0] creates locked monorepo directory skeleton', async () => {
  for (const path of requiredPaths) {
    await access(new URL(path, repoRoot));
  }
});

test('[P0] includes required root scaffold files', async () => {
  const requiredFiles = [
    'package.json',
    'pnpm-workspace.yaml',
    'Cargo.toml',
    'Anchor.toml',
    'rust-toolchain.toml',
    'tsconfig.base.json',
    'codama.config.mjs',
    '.editorconfig',
    '.eslintrc.js',
    '.prettierrc',
    '.nvmrc',
    '.env.example',
    'LICENSE',
    'README.md',
  ];

  for (const file of requiredFiles) {
    await access(new URL(file, repoRoot));
  }
});

test('[P1] records MIT license and public-from-commit-zero posture in README', async () => {
  const readme = await readFile(new URL('README.md', repoRoot), 'utf8');
  assert.match(readme, /MIT/i);
  assert.match(readme, /public-from-commit-zero/i);
});
