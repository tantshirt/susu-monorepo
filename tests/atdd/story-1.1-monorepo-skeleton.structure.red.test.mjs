import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';

const repoRoot = new URL('../../', import.meta.url);

const requiredDirectories = [
  'programs/susu',
  'programs/susu/src',
  'programs/susu/src/instructions',
  'programs/susu/src/state',
  'sdk/ts',
  'sdk/rust',
  'sdk/rust/src',
  'apps/reference',
  'examples/with-squads',
  'examples/with-privy',
  'examples/with-token-extensions',
  'crates/susu-adversary',
  'crates/susu-adversary/src',
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
  for (const path of requiredDirectories) {
    const target = new URL(path, repoRoot);
    await access(target);
    const targetStats = await stat(target);
    assert.equal(targetStats.isDirectory(), true, `${path} should be a directory`);
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

test('[P0] locks workspace manifests to Story 1.1 contract', async () => {
  const pkgJsonRaw = await readFile(new URL('package.json', repoRoot), 'utf8');
  const pkg = JSON.parse(pkgJsonRaw);

  assert.equal(pkg.private, true);
  assert.match(pkg.packageManager, /^pnpm@9\./);
  assert.ok(pkg.scripts?.['susu:demo']);
  assert.ok(pkg.scripts?.verify);
  assert.ok(pkg.scripts?.['sdk:codegen']);

  const pnpmWorkspaceRaw = await readFile(new URL('pnpm-workspace.yaml', repoRoot), 'utf8');
  assert.match(pnpmWorkspaceRaw, /-\s+"apps\/\*"/);
  assert.match(pnpmWorkspaceRaw, /-\s+"sdk\/ts"/);
  assert.match(pnpmWorkspaceRaw, /-\s+"examples\/\*"/);

  const cargoToml = await readFile(new URL('Cargo.toml', repoRoot), 'utf8');
  assert.match(cargoToml, /members = \["programs\/susu", "sdk\/rust", "crates\/\*"\]/);
  assert.match(cargoToml, /anchor-lang = "~1\.0\.2"/);
  assert.match(cargoToml, /anchor-spl = "~1\.0\.2"/);
});

test('[P1] includes required public env placeholders', async () => {
  const envExample = await readFile(new URL('.env.example', repoRoot), 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_HELIUS_RPC_URL=',
    'NEXT_PUBLIC_PRIVY_APP_ID=',
    'NEXT_PUBLIC_CONVEX_URL=',
    'NEXT_PUBLIC_CLUSTER=',
    'NEXT_PUBLIC_SUSU_PROGRAM_ID=',
    'NEXT_PUBLIC_TREASURY_MINT=',
  ];

  for (const variable of requiredVars) {
    assert.match(envExample, new RegExp(`^${variable}`, 'm'));
  }
});

test('[P1] records MIT license and public-from-commit-zero posture in README', async () => {
  const readme = await readFile(new URL('README.md', repoRoot), 'utf8');
  assert.match(readme, /MIT/i);
  assert.match(readme, /public-from-commit-zero/i);
});
