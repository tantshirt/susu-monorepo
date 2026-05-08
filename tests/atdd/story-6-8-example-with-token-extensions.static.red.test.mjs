import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const exampleDir = 'examples/with-token-extensions';
const packagePath = `${exampleDir}/package.json`;
const readmePath = `${exampleDir}/README.md`;
const srcDir = `${exampleDir}/src`;
const testDir = `${exampleDir}/tests`;

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertExists(path) {
  assert.ok(existsSync(path), `${path} must exist`);
}

function sourceLines() {
  return readdirSync(srcDir)
    .filter((name) => name.endsWith('.ts'))
    .flatMap((name) => read(`${srcDir}/${name}`).split('\n'))
    .filter((line) => line.trim() !== '').length;
}

test('Story 6.8 scaffolds an independently runnable Token-2022 example package', () => {
  for (const path of [packagePath, `${exampleDir}/tsconfig.json`, `${exampleDir}/.env.example`, `${srcDir}/index.ts`, `${srcDir}/mintSetup.ts`]) {
    assertExists(path);
  }

  const pkg = JSON.parse(read(packagePath));
  assert.equal(pkg.name, '@susu-examples/with-token-extensions');
  assert.equal(pkg.private, true);
  assert.equal(pkg.scripts?.start, 'tsx src/index.ts');
  assert.ok(pkg.scripts?.test?.includes('vitest run'), 'package must expose a Vitest test script');
  assert.ok(pkg.scripts?.build?.includes('tsc -p tsconfig.json'), 'package must expose a build script');
  assert.equal(pkg.dependencies?.['@susu/sdk'], 'workspace:*');
  assert.ok(pkg.dependencies?.['@solana-program/token-2022'], 'example must depend on kit-first Token-2022');
  assert.ok(pkg.dependencies?.['@solana/kit'], 'example must depend on @solana/kit');
  assert.ok(pkg.dependencies?.['@solana/web3-compat'], 'example must depend on @solana/web3-compat');
});

test('Story 6.8 source builds Token-2022 mint extensions and threads hook accounts through Susu helpers', () => {
  const source = `${read(`${srcDir}/index.ts`)}\n${read(`${srcDir}/mintSetup.ts`)}`;

  assert.ok(sourceLines() <= 200, 'src/ TypeScript must stay <=200 nonblank lines');
  assert.match(source, /TOKEN_2022_PROGRAM_ADDRESS/, 'example must use the Token-2022 program address');
  assert.match(source, /extension\(\s*['"]TransferHook['"]/, 'mint setup must enable Transfer Hook');
  assert.match(source, /extension\(\s*['"]MetadataPointer['"]/, 'mint setup must enable Metadata Pointer');
  assert.match(source, /extension\(\s*['"]PermanentDelegate['"]/, 'mint setup must enable Permanent Delegate');
  assert.match(source, /getProgramDerivedAddress/, 'Transfer Hook extra-account PDA flow must be represented');
  assert.match(source, /createSusuClient/, 'example must create a Susu SDK client');
  assert.match(source, /postCollateral/, 'example must call postCollateral with the Token-2022 mint');
  assert.match(source, /contribute/, 'example must call contribute with the Token-2022 mint');
  assert.match(source, /transferHookExtraAccounts|extraAccountMetaList/, 'example must thread hook extra accounts');
  assert.doesNotMatch(source, /@solana\/spl-token|@solana\/web3\.js/, 'example must stay kit-first');
});

test('Story 6.8 README documents extensions, v0.1 scope, and v2 confidential-transfer caveat', () => {
  assertExists(readmePath);
  const readme = read(readmePath);

  for (const term of ['Transfer Hook', 'Metadata Pointer', 'Permanent Delegate']) {
    assert.match(readme, new RegExp(term), `README must explain ${term}`);
  }
  assert.match(readme, /v0\.1\.0 supports SPL Token/i, 'README must state the v0.1.0 SPL Token support boundary');
  assert.match(readme, /mainnet-live as of May 2026/i, 'README must call out current Token-2022 extension availability');
  assert.match(readme, /post-v2/i, 'README must keep confidential transfer in the post-v2 roadmap');
  assert.match(readme, /ZK ElGamal/i, 'README must mention the ZK ElGamal re-enablement gate');
  assert.match(readme, /docs\/integration-token-extensions\.md/, 'README must link to the Story 6.9 companion doc');
});

test('Story 6.8 tests cover Token-2022 mint compatibility, hook PDA flow, and permanent delegate checks', () => {
  for (const path of [`${testDir}/mintSetup.test.ts`, `${testDir}/e2e.test.ts`]) {
    assertExists(path);
  }

  const tests = `${read(`${testDir}/mintSetup.test.ts`)}\n${read(`${testDir}/e2e.test.ts`)}`;
  assert.match(tests, /TransferHook[\s\S]*MetadataPointer[\s\S]*PermanentDelegate|PermanentDelegate[\s\S]*TransferHook/s, 'tests must cover all three extensions');
  assert.match(tests, /extraAccountMetaList|getProgramDerivedAddress|transferHookExtraAccounts/, 'tests must cover the Transfer Hook PDA flow');
  assert.match(tests, /permanentDelegateMatches|Permanent Delegate/i, 'tests must cover the Permanent Delegate authority check');
  assert.match(tests, /PNPM_TEST_E2E/, 'e2e coverage must be gated behind PNPM_TEST_E2E=1');
});
