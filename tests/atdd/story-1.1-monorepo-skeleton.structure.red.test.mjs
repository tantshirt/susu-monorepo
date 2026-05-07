import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

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
];

// RED phase scaffold: remove `.skip` when Story 1.1 implementation begins.
test.skip('[P0] creates locked monorepo directory skeleton', async () => {
  for (const path of requiredPaths) {
    await access(new URL(`../../../../${path}`, import.meta.url));
  }
});

// RED phase scaffold: remove `.skip` when Story 1.1 implementation begins.
test.skip('[P0] includes required root scaffold files', async () => {
  const requiredFiles = [
    'pnpm-workspace.yaml',
    'Cargo.toml',
    'Anchor.toml',
    'rust-toolchain.toml',
    'tsconfig.base.json',
    '.editorconfig',
    '.eslintrc.js',
    '.prettierrc',
    '.nvmrc',
    '.env.example',
    'LICENSE',
    'README.md',
  ];

  for (const file of requiredFiles) {
    await access(new URL(`../../../../${file}`, import.meta.url));
  }
});

// RED phase scaffold: remove `.skip` when Story 1.1 implementation begins.
test.skip('[P1] records MIT license and public-from-commit-zero posture in README', async () => {
  const readme = await readFile(new URL('../../../../README.md', import.meta.url), 'utf8');
  assert.match(readme, /MIT/i);
  assert.match(readme, /public-from-commit-zero/i);
});
