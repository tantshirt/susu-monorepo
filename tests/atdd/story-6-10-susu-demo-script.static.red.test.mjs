import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const storyPath = 'output_susu/implementation-artifacts/6-10-susu-demo-script.md';
const packagePath = 'package.json';
const shellPath = 'scripts/susu-demo.sh';
const runnerPath = 'scripts/susu-demo.mjs';
const docsPath = 'docs/troubleshooting.md';
const ciPath = '.github/workflows/ci.yml';

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertExists(path) {
  assert.ok(existsSync(path), `${path} must exist`);
}

test('Story 6.10 wires the public demo command to a strict shell orchestrator', () => {
  for (const path of [storyPath, packagePath, shellPath, runnerPath]) {
    assertExists(path);
  }

  const pkg = JSON.parse(read(packagePath));
  assert.equal(pkg.scripts?.['susu:demo'], 'bash scripts/susu-demo.sh');

  const shell = read(shellPath);
  assert.match(shell, /set -euo pipefail/, 'shell script must run in strict mode');
  assert.match(shell, /\b(anchor|command -v anchor)\b/, 'shell script must check Anchor CLI');
  assert.match(shell, /\b(solana|command -v solana)\b/, 'shell script must check Solana CLI');
  assert.match(shell, /\bnode\b/, 'shell script must check Node.js');
  assert.match(shell, /\bpnpm\b/, 'shell script must check pnpm');
  assert.match(shell, /node\s+scripts\/susu-demo\.mjs/, 'shell script must invoke the JS runner');
  assert.match(shell, /SUSU_DEMO_MAX_SECONDS[\s\S]*60/, 'shell script must default the budget to 60 seconds');
  assert.match(shell, /Wall-clock:\s*\$\{?[A-Za-z0-9_]+/, 'shell script must print a final wall-clock line');
  assert.ok((statSync(shellPath).mode & 0o111) !== 0, 'shell script must be executable');

  assert.equal(spawnSync('bash', ['-n', shellPath], { encoding: 'utf8' }).status, 0, 'shell script must parse');
});

test('Story 6.10 runner drives the 5-member ROSCA lifecycle via @susu/sdk', () => {
  const runner = read(runnerPath);
  assert.match(runner, /from ['"]@susu\/sdk['"]/, 'runner must consume @susu/sdk');
  assert.doesNotMatch(runner, /@solana\/web3\.js/, 'runner must not import @solana/web3.js');

  for (const helper of ['createGroup', 'acceptInvite', 'postCollateral', 'contribute', 'claimPayout']) {
    assert.match(runner, new RegExp(`\\b${helper}\\b`), `runner must call ${helper}`);
  }

  assert.match(runner, /memberCount\s*=\s*5|Array\.from\(\s*\{\s*length:\s*5\s*\}/, 'runner must create a 5-member circle');
  assert.match(runner, /Promise\.all[\s\S]*acceptInvite/, 'member joins must be parallelized');
  assert.match(runner, /Promise\.all[\s\S]*postCollateral/, 'collateral posts must be parallelized');
  assert.match(runner, /Promise\.all[\s\S]*contribute/, 'round contributions must be parallelized');
  assert.match(runner, /for\s*\([^)]*round[\s\S]*<\s*5|rounds\s*=\s*5/, 'runner must execute 5 rounds');
  assert.match(runner, /solscan\.io\/tx\/[\s\S]*cluster=/, 'runner must print cluster-aware Solscan links');
  assert.match(runner, /commitment:\s*['"]confirmed['"]|confirmedCommitment|SUSU_DEMO_COMMITMENT/, 'runner must use confirmed commitment for waits');

  assert.equal(spawnSync('node', ['--check', runnerPath], { encoding: 'utf8' }).status, 0, 'runner must parse');
});

test('Story 6.10 classifies required failure buckets with recovery docs', () => {
  for (const path of [runnerPath, shellPath, docsPath]) {
    assertExists(path);
  }

  const combined = `${read(runnerPath)}\n${read(shellPath)}\n${read(docsPath)}`;
  for (const bucket of ['rpc-reachability', 'devnet-airdrop-limit', 'dependency-mismatch', 'performance-budget']) {
    assert.match(combined, new RegExp(bucket), `missing ${bucket} bucket`);
  }

  assert.match(combined, /docs\/troubleshooting\.md#rpc/, 'RPC failures must link to troubleshooting RPC docs');
  assert.match(combined, /docs\/troubleshooting\.md#devnet-airdrop-limit/, 'airdrop failures must link to troubleshooting airdrop docs');
  assert.match(combined, /docs\/troubleshooting\.md#dependency-mismatch/, 'dependency failures must link to troubleshooting dependency docs');
  assert.match(combined, /docs\/troubleshooting\.md#performance-budget/, 'budget failures must link to troubleshooting performance docs');
  assert.match(combined, /Helius\/Solana devnet RPC unreachable/i);
  assert.match(combined, /Devnet airdrop rate limit/i);
  assert.match(combined, /Toolchain mismatch/i);
});

test('Story 6.10 keeps RPC failures out of the dependency bucket', async () => {
  const { classifyDemoError } = await import(pathToFileURL(runnerPath).href);

  assert.equal(
    classifyDemoError(new Error('Solana node connection refused')).bucket,
    'rpc-reachability',
    'Solana transport failures must remain RPC failures',
  );
  assert.equal(
    classifyDemoError(new Error('Transaction version not supported by RPC node')).bucket,
    'rpc-reachability',
    'RPC transaction-version failures must not be dependency failures',
  );
  assert.equal(
    classifyDemoError(new Error('Cannot find module @susu/sdk')).bucket,
    'dependency-mismatch',
    'actual module resolution failures must still be dependency failures',
  );
});

test('Story 6.10 adds a Surfpool-backed main-branch CI smoke job', () => {
  assertExists(ciPath);
  const workflow = read(ciPath);

  assert.match(workflow, /push:[\s\S]*branches:[\s\S]*main/, 'workflow must run on main pushes');
  assert.match(workflow, /susu-demo-smoke:/, 'workflow must include a susu-demo-smoke job');
  assert.match(workflow, /surfpool\s+start[\s\S]*(--network\s+devnet|-n\s+devnet)/, 'job must start a Surfpool devnet fork');
  assert.match(workflow, /--port\s+8899|-p\s+8899/, 'Surfpool fork must expose RPC port 8899');
  assert.match(workflow, /SUSU_DEMO_RPC_URL:\s*http:\/\/127\.0\.0\.1:8899/, 'demo must run against the Surfpool RPC URL');
  assert.match(workflow, /pnpm\s+susu:demo/, 'job must run pnpm susu:demo');
  assert.match(workflow, /Wall-clock:\s*\[0-9\]\+\?s|Wall-clock:.*([0-9]+)s/, 'job must parse the final wall-clock line');
  assert.match(workflow, /SUSU_DEMO_MAX_SECONDS:\s*60|MAX_SECONDS=60/, 'job must enforce the 60s budget');
});

test('Story 6.10 shell command fails when the wall-clock budget is exceeded', () => {
  assertExists(shellPath);
  const result = spawnSync('bash', [shellPath], {
    encoding: 'utf8',
    timeout: 20_000,
    env: {
      ...process.env,
      SUSU_DEMO_SKIP_PREFLIGHT: '1',
      SUSU_DEMO_MAX_SECONDS: '-1',
      NO_COLOR: '1',
    },
  });

  assert.notEqual(result.status, 0, 'demo must fail when elapsed time is greater than budget');
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /Demo exceeded NFR-P2 budget/, 'failure must explain the budget breach');
  assert.match(output, /\[performance-budget\]/, 'budget breach must use the performance bucket');
  assert.match(output, /docs\/troubleshooting\.md#performance-budget/, 'budget breach must link to the performance docs');
});
