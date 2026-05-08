import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const root = 'examples/with-squads';
const packagePath = `${root}/package.json`;
const readmePath = `${root}/README.md`;
const envPath = `${root}/.env.example`;
const indexPath = `${root}/src/index.ts`;
const adapterPath = `${root}/src/multisigSigner.ts`;
const unitTestPath = `${root}/tests/adapter.test.ts`;
const e2eTestPath = `${root}/tests/e2e.test.ts`;

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertExists(path) {
  assert.ok(existsSync(path), `${path} must exist`);
}

test('Story 6.7 scaffolds an independently runnable Squads example package', () => {
  for (const path of [packagePath, readmePath, envPath, indexPath, adapterPath]) {
    assertExists(path);
  }

  const pkg = JSON.parse(read(packagePath));
  assert.equal(pkg.name, '@susu-examples/with-squads');
  assert.equal(pkg.private, true);
  for (const script of ['start', 'test', 'build']) {
    assert.ok(pkg.scripts?.[script], `package.json must define ${script}`);
  }
  for (const dep of ['@susu/sdk', '@sqds/multisig', '@solana/kit', '@solana/web3-compat']) {
    assert.ok(pkg.dependencies?.[dep], `package.json must depend on ${dep}`);
  }

  const env = read(envPath);
  assert.match(env, /HELIUS_RPC_URL=/);
  assert.match(env, /CLUSTER=devnet/);
  assert.match(env, /MULTISIG_PUBKEY=/);
});

test('Story 6.7 implements the Squads multisig-as-creator flow', () => {
  const index = read(indexPath);
  const adapter = read(adapterPath);

  assert.match(index, /createSusuClient/);
  assert.match(index, /createGroup/);
  assert.match(index, /deriveGroupPda/);
  assert.match(index, /creator:\s*squadsSigner\.address/);
  assert.match(index, /verifiedCreator[\s\S]*squadsSigner\.address/);
  assert.match(adapter, /@sqds\/multisig/);
  assert.match(adapter, /createSquadsMultisigSigner/);
  assert.match(adapter, /createVaultTransaction/);
  assert.match(adapter, /approveVaultTransaction/);
  assert.match(adapter, /executeVaultTransaction/);
  assert.match(adapter, /threshold/);
  assert.doesNotMatch(`${index}\n${adapter}`, /@solana\/web3\.js/);
  assert.doesNotMatch(`${index}\n${adapter}`, /apps\/reference|\.\.\/with-/);
});

test('Story 6.7 keeps the example small and documents governance trade-offs', () => {
  const srcFiles = readdirSync(`${root}/src`).filter((name) => name.endsWith('.ts'));
  const sourceLines = srcFiles
    .map((name) => read(`${root}/src/${name}`).split('\n').filter((line) => line.trim() !== '').length)
    .reduce((sum, count) => sum + count, 0);
  assert.ok(sourceLines <= 200, `src should be <=200 non-empty LOC, found ${sourceLines}`);

  const readme = read(readmePath);
  for (const heading of ['What this demonstrates', 'Setup', 'Run', 'Trade-offs of multisig governance', 'See also']) {
    assert.match(readme, new RegExp(`## ${heading}`), `README must include ${heading}`);
  }
  for (const term of ['latency', 'recovery', 'censorship', 'threshold', 'mainnet']) {
    assert.match(readme, new RegExp(term, 'i'), `README trade-offs must cover ${term}`);
  }
});

test('Story 6.7 has unit and gated e2e happy-path tests', () => {
  for (const path of [unitTestPath, e2eTestPath]) {
    assertExists(path);
  }

  const unitTest = read(unitTestPath);
  const e2eTest = read(e2eTestPath);
  assert.match(unitTest, /createGroup/);
  assert.match(unitTest, /multisigPda|squadsSigner\.address/);
  assert.match(unitTest, /approvals/);
  assert.match(e2eTest, /PNPM_TEST_E2E/);
  assert.match(e2eTest, /verifiedCreator/);
});
