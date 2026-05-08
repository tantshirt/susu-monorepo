import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const storyPath = 'output_susu/implementation-artifacts/6-3-sdk-error-classes.md';
const errorsPath = 'sdk/ts/src/errors.ts';
const executeTxPath = 'sdk/ts/src/lib/executeTx.ts';
const publicBarrelPath = 'sdk/ts/src/index.ts';
const docsPath = 'docs/sdk-typescript.md';
const unitTestPath = 'sdk/ts/tests/errors.test.ts';
const programErrorsPath = 'sdk/ts/src/lib/programErrors.ts';

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertExists(path) {
  assert.ok(existsSync(path), `${path} must exist`);
}

test('Story 6.3 defines a discriminated SDK error taxonomy', () => {
  for (const path of [storyPath, errorsPath, publicBarrelPath]) {
    assertExists(path);
  }

  const errors = read(errorsPath);
  const publicBarrel = read(publicBarrelPath);

  assert.match(errors, /abstract\s+class\s+SusuErrorBase\s+extends\s+Error/, 'SusuErrorBase must be the abstract base class');
  assert.match(errors, /class\s+SusuError\s+extends\s+SusuErrorBase/, 'SusuError must extend SusuErrorBase');
  assert.match(errors, /class\s+SusuSimulationError\s+extends\s+SusuErrorBase/, 'SusuSimulationError must extend SusuErrorBase');
  assert.match(errors, /class\s+SusuRpcError\s+extends\s+SusuErrorBase/, 'SusuRpcError must extend SusuErrorBase');
  assert.match(errors, /class\s+SusuClusterError\s+extends\s+SusuErrorBase/, 'SusuClusterError must extend SusuErrorBase');
  assert.match(errors, /\bkind\s*=\s*['"]program['"]|\bkind:\s*['"]program['"]/, 'program errors need kind="program"');
  assert.match(errors, /\bkind\s*=\s*['"]simulation['"]|\bkind:\s*['"]simulation['"]/, 'simulation errors need kind="simulation"');
  assert.match(errors, /\bkind\s*=\s*['"]rpc['"]|\bkind:\s*['"]rpc['"]/, 'RPC errors need kind="rpc"');
  assert.match(errors, /\bkind\s*=\s*['"]cluster['"]|\bkind:\s*['"]cluster['"]/, 'cluster errors need kind="cluster"');
  assert.match(errors, /isSusuError|isSusuProgramError|isSusuSimulationError|isSusuRpcError|isSusuClusterError/, 'type guards must be present');
  assert.match(publicBarrel, /SusuErrorBase[\s\S]*SusuRpcError|SusuRpcError[\s\S]*SusuErrorBase/, 'public barrel must export the taxonomy');
});

test('Story 6.3 decodes Anchor errors from simulation logs', () => {
  for (const path of [executeTxPath, programErrorsPath]) {
    assertExists(path);
  }

  const executeTx = read(executeTxPath);
  const programErrors = read(programErrorsPath);

  assert.match(programErrors, /6000[\s\S]*GroupFull|GroupFull[\s\S]*6000/, 'program error map must include IDL-sourced numeric codes');
  assert.match(programErrors, /decodeSusuProgramError|lookupSusuProgramError/, 'program error helper must decode numeric program errors');
  assert.match(executeTx, /AnchorError[\s\S]*ErrorNumber|ErrorNumber[\s\S]*AnchorError/, 'executeTx must parse Anchor ErrorNumber logs');
  assert.match(executeTx, /new\s+SusuError\(/, 'executeTx must construct decoded SusuError causes');
  assert.match(executeTx, /cause:\s*decoded|cause:\s*programError|decodedProgramError/, 'simulation error must carry decoded program cause');
});

test('Story 6.3 wraps RPC transport failures and forbids bare throws', () => {
  const executeTx = read(executeTxPath);
  const srcFiles = [
    errorsPath,
    executeTxPath,
    'sdk/ts/src/client.ts',
    ...['acceptInvite', 'cancelGroup', 'claimPayout', 'contribute', 'createGroup', 'postCollateral', 'topUpCollateral', 'withdrawCollateral'].map(
      (helper) => `sdk/ts/src/helpers/${helper}.ts`,
    ),
  ];

  assert.match(executeTx, /new\s+SusuRpcError\(/, 'executeTx must wrap RPC transport failures in SusuRpcError');

  for (const path of srcFiles) {
    assertExists(path);
    const source = read(path);
    assert.doesNotMatch(source, /throw\s+new\s+Error\s*\(/, `${path} must not throw bare Error`);
    assert.doesNotMatch(source, /Promise\.reject\s*\(\s*['"`]/, `${path} must not reject with a string literal`);
  }
});

test('Story 6.3 unit tests and docs cover pattern matching', () => {
  for (const path of [unitTestPath, docsPath]) {
    assertExists(path);
  }

  const tests = read(unitTestPath);
  const docs = read(docsPath);

  assert.match(tests, /AnchorError[\s\S]*ErrorNumber|ErrorNumber[\s\S]*AnchorError/, 'unit tests must cover Anchor program decode');
  assert.match(tests, /non-Anchor|non Anchor|nonAnchor/i, 'unit tests must cover non-Anchor simulation failure');
  assert.match(tests, /timeout|AbortError|SusuRpcError/i, 'unit tests must cover RPC timeout wrapping');
  assert.match(tests, /switch\s*\(\s*.*\.kind\s*\)/, 'unit tests must compile discriminated kind narrowing');
  assert.match(docs, /SusuErrorBase[\s\S]*SusuRpcError|SusuRpcError[\s\S]*SusuErrorBase/, 'docs must list the full taxonomy');
  assert.match(docs, /switch\s*\(\s*err\.kind\s*\)/, 'docs must show switch(err.kind) pattern matching');
  assert.match(docs, /\|\s*program\s*\|[\s\S]*\|\s*simulation\s*\|[\s\S]*\|\s*rpc\s*\|[\s\S]*\|\s*cluster\s*\|/, 'docs need recovery hints by error kind');
});
