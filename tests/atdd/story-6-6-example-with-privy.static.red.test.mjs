import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const exampleDir = 'examples/with-privy';
const packagePath = `${exampleDir}/package.json`;
const readmePath = `${exampleDir}/README.md`;
const envPath = `${exampleDir}/.env.example`;
const srcDir = `${exampleDir}/src`;
const testDir = `${exampleDir}/tests`;

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertExists(path) {
  assert.ok(existsSync(path), `${path} must exist`);
}

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

test('Story 6.6 scaffolds an independent with-privy example package', () => {
  for (const path of [packagePath, readmePath, envPath, `${srcDir}/index.ts`, `${srcDir}/privyAdapter.ts`]) {
    assertExists(path);
  }

  const pkg = JSON.parse(read(packagePath));
  assert.equal(pkg.name, '@susu-examples/with-privy');
  assert.equal(pkg.private, true);
  assert.ok(pkg.scripts?.start, 'package must expose pnpm start');
  assert.ok(pkg.scripts?.build, 'package must expose pnpm build');
  assert.ok(pkg.scripts?.test, 'package must expose pnpm test');

  for (const dep of ['@susu/sdk', '@privy-io/node', '@solana/kit', '@solana/web3-compat']) {
    assert.ok(pkg.dependencies?.[dep] ?? pkg.devDependencies?.[dep], `${dep} must be declared`);
  }
});

test('Story 6.6 source demonstrates Privy signing through the Susu SDK happy path', () => {
  const index = read(`${srcDir}/index.ts`);
  const adapter = read(`${srcDir}/privyAdapter.ts`);
  const combined = `${index}\n${adapter}`;

  assert.match(index, /PrivyClient/, 'example must instantiate or accept a Privy client');
  assert.match(index, /wallets\(\)\.create\(\{[^}]*chain_type:\s*['"]solana['"]/s, 'example must create Solana Privy wallets');
  assert.match(index, /createSusuClient/, 'example must create a Susu SDK client');
  for (const helper of ['createGroup', 'acceptInvite', 'postCollateral', 'contribute']) {
    assert.match(index, new RegExp(`\\b${helper}\\b`), `example must call ${helper}`);
  }
  assert.match(adapter, /TransactionSigner/, 'adapter must expose a kit-compatible TransactionSigner');
  assert.match(adapter, /signAndSendTransaction|signTransaction|signMessage/, 'adapter must call a Privy Solana signing method');
  assert.match(combined, /process\.env/, 'runtime config must come from env vars');
});

test('Story 6.6 source is small, kit-first, and independent of reference app code', () => {
  const files = sourceFiles(srcDir);
  const combined = files.map(read).join('\n');
  const loc = files.reduce((sum, path) => sum + read(path).split(/\r?\n/).filter((line) => line.trim()).length, 0);

  assert.ok(loc <= 200, `source LOC must be <= 200, got ${loc}`);
  assert.doesNotMatch(combined, /@solana\/web3\.js/, 'example must not import @solana/web3.js');
  assert.doesNotMatch(combined, /apps\/reference|\.\.\/\.\.\/apps\/reference/, 'example must not depend on apps/reference');
  assert.doesNotMatch(combined, /examples\/with-|from\s+['"]\.\.\/with-/, 'example must not import another example package');
});

test('Story 6.6 README, env example, and tests cover setup and happy path', () => {
  for (const path of [`${testDir}/adapter.test.ts`, `${testDir}/e2e.test.ts`]) {
    assertExists(path);
  }

  const readme = read(readmePath);
  for (const section of ['What this demonstrates', 'Setup', 'Run', 'Trade-offs', 'See also']) {
    assert.match(readme, new RegExp(`## ${section}`), `README must include ## ${section}`);
  }
  for (const env of ['PRIVY_APP_ID', 'PRIVY_APP_SECRET', 'HELIUS_RPC_URL', 'CLUSTER=devnet']) {
    assert.match(read(envPath), new RegExp(env), `.env.example must document ${env}`);
  }

  const tests = `${read(`${testDir}/adapter.test.ts`)}\n${read(`${testDir}/e2e.test.ts`)}`;
  assert.match(tests, /PNPM_TEST_E2E/, 'e2e test must be gated behind PNPM_TEST_E2E');
  assert.match(tests, /createGroup[\s\S]*acceptInvite[\s\S]*postCollateral[\s\S]*contribute/, 'tests must cover the happy path helpers');
});
