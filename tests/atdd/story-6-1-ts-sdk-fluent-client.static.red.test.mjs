import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const storyPath = 'output_susu/implementation-artifacts/6-1-ts-sdk-fluent-client.md';
const packagePath = 'sdk/ts/package.json';
const indexPath = 'sdk/ts/src/index.ts';
const clientPath = 'sdk/ts/src/client.ts';
const sdkReadmePath = 'sdk/ts/README.md';
const generatedInstructionsDir = 'sdk/ts/src/generated/instructions';

const stateHelpers = [
  'createGroup',
  'acceptInvite',
  'postCollateral',
  'contribute',
  'claimPayout',
  'topUpCollateral',
  'withdrawCollateral',
  'cancelGroup',
];

const readHelpers = ['getGroup', 'getMemberPosition', 'queryHistory'];
const allHelpers = [...stateHelpers, ...readHelpers];

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertExists(path) {
  assert.ok(existsSync(path), `${path} must exist`);
}

test('Story 6.1 exposes a fluent createSusuClient surface', () => {
  for (const path of [storyPath, clientPath, indexPath]) {
    assertExists(path);
  }

  const client = read(clientPath);
  const index = read(indexPath);

  assert.match(client, /export\s+function\s+createSusuClient\b/, 'client.ts must export createSusuClient');
  assert.match(client, /\buse\s*\(\s*plugin\b/, 'SusuClient must expose .use(plugin) chaining');
  assert.match(client, /SusuPlugin\s*=.*Partial<\s*SusuClient/s, 'plugin shape must return Partial<SusuClient>');
  assert.match(client, /\bcluster\b[\s\S]*\brpc\b[\s\S]*\bsigner\b[\s\S]*\bprogramId\b/, 'client state must carry cluster, rpc, signer, and programId');
  assert.match(client, /export\s+function\s+signer\b/, 'client.ts must export signer plugin helper');
  assert.match(client, /export\s+function\s+solanaDevnetRpc\b/, 'client.ts must export solanaDevnetRpc plugin helper');
  assert.match(index, /createSusuClient/, 'index.ts must re-export createSusuClient');
  assert.match(index, /solanaDevnetRpc/, 'index.ts must re-export solanaDevnetRpc');
});

test('Story 6.1 state helpers delegate to generated Codama builders and prepend compute budget instructions', () => {
  assertExists(generatedInstructionsDir);

  for (const helper of stateHelpers) {
    const helperPath = `sdk/ts/src/helpers/${helper}.ts`;
    assertExists(helperPath);

    const source = read(helperPath);
    assert.match(source, new RegExp(`generated/instructions/${helper}\\.js`), `${helper} must import its generated builder`);
    assert.match(source, new RegExp(`\\b${helper}\\s*\\(`), `${helper} helper must call its generated builder`);
    assert.match(source, /@example[\s\S]+@solana\/kit/, `${helper} must have a kit-first runnable JSDoc example`);
    assert.doesNotMatch(source, /@solana\/web3\.js/, `${helper} must not import @solana/web3.js`);
    assert.doesNotMatch(source, /Buffer\.from|Uint8Array\s*\(|discriminator|AccountMeta|keys:\s*\[/, `${helper} must not hand-roll instruction bytes or account metas`);
  }

  const helperSources = stateHelpers.map((helper) => read(`sdk/ts/src/helpers/${helper}.ts`)).join('\n');
  const clientSource = read(clientPath);
  const combined = `${clientSource}\n${helperSources}`;

  assert.match(combined, /getSetComputeUnitLimitInstruction|setTransactionMessageComputeUnitLimit/, 'state helpers must use kit-compatible compute-unit-limit builders');
  assert.match(combined, /getSetComputeUnitPriceInstruction|setTransactionMessageComputeUnitPrice/, 'state helpers must use kit-compatible compute-unit-price builders');
  assert.match(combined, /200_000|200000/, 'default compute unit limit must be 200,000');
  assert.match(combined, /getPriorityFeeEstimate/, 'default priority fee must come from Helius getPriorityFeeEstimate when available');
  assert.match(combined, /computeUnits[\s\S]*priorityFee|priorityFee[\s\S]*computeUnits/, 'compute budget overrides must include computeUnits and priorityFee');
});

test('Story 6.1 read helpers use generated account decoders and existing PDA/query surfaces', () => {
  for (const helper of readHelpers) {
    const helperPath = `sdk/ts/src/helpers/${helper}.ts`;
    assertExists(helperPath);

    const source = read(helperPath);
    assert.match(source, /generated\/accounts|\.\/queries|helpers\/queries|decodeGroup|decodeMemberPosition/, `${helper} must decode via generated account/query helpers`);
    assert.match(source, /@example[\s\S]+@solana\/kit/, `${helper} must have a kit-first runnable JSDoc example`);
    assert.doesNotMatch(source, /@solana\/web3\.js/, `${helper} must not import @solana/web3.js`);
  }
});

test('Story 6.1 package API exports helpers, generated surface, docs, and dist package metadata', () => {
  for (const path of [packagePath, indexPath, sdkReadmePath]) {
    assertExists(path);
  }

  const pkg = JSON.parse(read(packagePath));
  const index = read(indexPath);
  const readme = read(sdkReadmePath);

  assert.equal(pkg.name, '@susu/sdk', 'package must be named @susu/sdk');
  assert.equal(pkg.version, '0.1.0-alpha.0', 'package version must be the Story 6.1 alpha');
  assert.match(pkg.main, /^\.\/dist\//, 'main must point at dist/');
  assert.match(pkg.module, /^\.\/dist\//, 'module must point at dist/');
  assert.match(pkg.types, /^\.\/dist\//, 'types must point at dist/');
  assert.ok(pkg.exports?.['.'], 'package exports must declare "."');
  assert.ok(pkg.exports?.['./generated'], 'package exports must declare "./generated"');
  assert.ok(pkg.peerDependencies?.['@solana/kit'], '@solana/kit must be a peer dependency');
  assert.ok(pkg.peerDependencies?.['@solana/web3-compat'], '@solana/web3-compat must be a peer dependency');

  for (const helper of allHelpers) {
    assert.match(index, new RegExp(`\\b${helper}\\b`), `index.ts must export ${helper}`);
    assert.match(readme, new RegExp(`\\b${helper}\\b`), `README must document ${helper}`);
  }

  assert.match(index, /generated\/index\.js/, 'index.ts must re-export generated surface');
  assert.doesNotMatch(read('sdk/ts/src/index.ts'), /@solana\/web3\.js/, 'index must not import @solana/web3.js');
});
