import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const storyPath = 'output_susu/implementation-artifacts/6-2-sdk-simulate-cluster-gate.md';
const clientPath = 'sdk/ts/src/client.ts';
const errorsPath = 'sdk/ts/src/errors.ts';
const executeTxPath = 'sdk/ts/src/lib/executeTx.ts';
const statePath = 'sdk/ts/src/helpers/internal/state.ts';
const docsPath = 'docs/sdk-typescript.md';
const clientTestPath = 'sdk/ts/tests/client.test.ts';
const simulateTestPath = 'sdk/ts/tests/simulate.test.ts';

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

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertExists(path) {
  assert.ok(existsSync(path), `${path} must exist`);
}

test('Story 6.2 defines explicit-cluster client gates and typed SDK errors', () => {
  for (const path of [storyPath, clientPath, errorsPath]) {
    assertExists(path);
  }

  const client = read(clientPath);
  const errors = read(errorsPath);

  assert.match(errors, /class\s+SusuClusterError\s+extends\s+(?:Error|SusuErrorBase)/, 'SusuClusterError must extend Error or the SDK error base');
  assert.match(errors, /class\s+SusuSimulationError\s+extends\s+(?:Error|SusuErrorBase)/, 'SusuSimulationError must extend Error or the SDK error base');
  assert.match(errors, /\bkind\s*=\s*['"]cluster['"]|\bkind:\s*['"]cluster['"]/, 'SusuClusterError must discriminate with kind="cluster"');
  assert.match(errors, /\bkind\s*=\s*['"]simulation['"]|\bkind:\s*['"]simulation['"]/, 'SusuSimulationError must discriminate with kind="simulation"');
  assert.match(errors, /\blogs\b/, 'SusuSimulationError must expose logs');
  assert.match(errors, /\bprogramLogs\b/, 'SusuSimulationError must expose programLogs');

  assert.match(client, /cluster:\s*Cluster/, 'SusuClientOptions must require an explicit cluster');
  assert.doesNotMatch(client, /cluster\?\s*:\s*Cluster/, 'cluster must not remain optional');
  assert.match(client, /throw\s+new\s+SusuClusterError/, 'client creation must throw SusuClusterError for cluster violations');
  assert.match(client, /mainnet-beta/, 'client gate must recognize explicit mainnet-beta');
  assert.match(client, /getGenesisHash|genesis hash|MAINNET_BETA_GENESIS_HASH/i, 'mainnet-resolution heuristic must account for genesis hash');
});

test('Story 6.2 routes every state-changing helper through executeTx with simulate-before-send', () => {
  for (const path of [executeTxPath, statePath]) {
    assertExists(path);
  }

  const executeTx = read(executeTxPath);
  const state = read(statePath);

  assert.match(executeTx, /export\s+async\s+function\s+executeTx\b/, 'executeTx must be the shared state-changing send path');
  assert.match(executeTx, /simulate\s*=\s*options\.simulate\s*\?\?\s*true|options\.simulate\s*\?\?\s*true/, 'simulate must default to true');
  assert.match(executeTx, /\bsimulateTransaction\b/, 'executeTx must call rpc.simulateTransaction');
  assert.match(executeTx, /throw\s+new\s+SusuSimulationError/, 'simulation failures must throw SusuSimulationError');
  assert.match(executeTx, /\blogs\b[\s\S]*programLogs|programLogs[\s\S]*logs/, 'simulation logs and program logs must be preserved');
  assert.match(executeTx, /Promise<\s*TransactionSignature\s*>/, 'executeTx must return a TransactionSignature');

  const firstSimulation = executeTx.indexOf('simulateOrThrow');
  const firstSendInstructions = executeTx.indexOf('sendInstructions');
  const firstSendTransaction = executeTx.indexOf('sendTransaction');
  const firstSend = Math.min(
    ...[firstSendInstructions, firstSendTransaction].filter((index) => index >= 0),
  );
  assert.ok(firstSimulation >= 0 && firstSend >= 0 && firstSimulation < firstSend, 'simulation must happen before the send path');

  assert.match(state, /executeTx/, 'state helper adapter must call executeTx');
  assert.doesNotMatch(state, /\bsendInstructions\b/, 'state helper adapter must not use the old sendInstructions path');

  for (const helper of stateHelpers) {
    const source = read(`sdk/ts/src/helpers/${helper}.ts`);
    assert.doesNotMatch(source, /\bsendTransaction\b|\bsendInstructions\b|\bsimulateTransaction\b/, `${helper} must not bypass executeTx`);
    assert.doesNotMatch(source, /@solana\/web3\.js/, `${helper} must not import @solana/web3.js`);
  }
});

test('Story 6.2 unit tests cover simulation, cluster gates, mainnet success, and simulate false', () => {
  for (const path of [clientTestPath, simulateTestPath]) {
    assertExists(path);
  }

  const clientTest = read(clientTestPath);
  const simulateTest = read(simulateTestPath);
  const combined = `${clientTest}\n${simulateTest}`;

  assert.match(clientTest, /SusuClusterError/, 'client tests must assert typed cluster errors');
  assert.match(clientTest, /missing|without|undefined/i, 'client tests must cover missing cluster rejection');
  assert.match(clientTest, /mainnet-beta[\s\S]*devnet|devnet[\s\S]*mainnet-beta/, 'client tests must cover mainnet-resolved mismatch');
  assert.match(clientTest, /mainnet-beta[\s\S]*success|success[\s\S]*mainnet-beta|does not throw/i, 'client tests must cover explicit mainnet success');
  assert.match(simulateTest, /simulateTransaction/, 'simulate tests must mock simulateTransaction');
  assert.match(simulateTest, /SusuSimulationError/, 'simulate tests must assert typed simulation failures');
  assert.match(simulateTest, /simulate:\s*false/, 'simulate tests must cover the escape hatch');
  assert.match(combined, /sendTransaction|sendInstructions/, 'tests must assert a signature-returning send path');
});

test('Story 6.2 docs and SDK source stay kit-first and document recovery behavior', () => {
  assertExists(docsPath);

  const docs = read(docsPath);

  assert.match(docs, /simulateTransaction|simulate:\s*true|simulate by default/i, 'docs must explain default simulation');
  assert.match(docs, /simulate:\s*false/i, 'docs must document the advanced escape hatch');
  assert.match(docs, /mainnet-beta/i, 'docs must show explicit mainnet-beta production usage');
  assert.match(docs, /heuristic|genesis hash|known endpoint/i, 'docs must document mainnet-resolution heuristic limits');
  assert.match(docs, /SusuSimulationError[\s\S]*SusuClusterError|SusuClusterError[\s\S]*SusuSimulationError/, 'docs must map typed failures to recovery hints');

  for (const path of [clientPath, errorsPath, executeTxPath, statePath, ...stateHelpers.map((helper) => `sdk/ts/src/helpers/${helper}.ts`)]) {
    assert.doesNotMatch(read(path), /@solana\/web3\.js/, `${path} must not import @solana/web3.js`);
  }
});
