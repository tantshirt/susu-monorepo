import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

test('susu-client crate metadata is publishable and has required dependencies', () => {
  const cargo = read('sdk/rust/Cargo.toml');

  assert.match(cargo, /name\s*=\s*"susu-client"/);
  assert.match(cargo, /version\s*=\s*"0\.1\.0-alpha\.0"/);
  assert.match(cargo, /edition\s*=\s*"2021"/);
  assert.match(cargo, /publish\s*=\s*true/);
  assert.match(cargo, /license\s*=\s*"MIT"/);
  for (const dep of ['solana-sdk', 'solana-client', 'thiserror', 'borsh']) {
    assert.match(cargo, new RegExp(`^${dep}\\s*=`, 'm'), `${dep} must be a direct dependency`);
  }
});

test('lib.rs re-exports the Rust SDK public modules', () => {
  const lib = read('sdk/rust/src/lib.rs');
  for (const moduleName of ['client', 'instructions', 'accounts', 'pdas', 'errors', 'generated']) {
    assert.match(lib, new RegExp(`pub\\s+mod\\s+${moduleName}\\s*;`), `${moduleName} module must be public`);
  }
  for (const exportName of ['SusuClient', 'Cluster', 'SusuError', 'SusuProgramError']) {
    assert.match(lib, new RegExp(`pub\\s+use[\\s\\S]*${exportName}`), `${exportName} must be re-exported`);
  }
});

test('Rust client mirrors TS helper names and simulate-by-default semantics', () => {
  assert.ok(existsSync('sdk/rust/src/client.rs'), 'client.rs must exist');
  const client = read('sdk/rust/src/client.rs');

  assert.match(client, /pub\s+struct\s+SusuClient/);
  assert.match(client, /pub\s+enum\s+Cluster/);
  assert.match(client, /pub\s+fn\s+new\s*\(\s*cluster\s*:\s*Cluster\s*,\s*rpc\s*:\s*RpcClient\s*\)/);

  for (const helper of [
    'create_group',
    'accept_invite',
    'post_collateral',
    'contribute',
    'claim_payout',
    'top_up_collateral',
    'withdraw_collateral',
    'cancel_group',
  ]) {
    assert.match(client, new RegExp(`pub\\s+fn\\s+${helper}\\s*\\(`), `${helper} builder missing`);
  }

  assert.match(client, /simulate\s*:\s*true/, 'builders must simulate before send by default');
  assert.match(client, /with_simulate\s*\(/, 'builders must expose with_simulate(false) override');
  assert.match(client, /simulate_transaction/, 'send path must call RpcClient simulation before send');
});

test('PDA derivation uses canonical seed constants and exposes all required derivations', () => {
  assert.ok(existsSync('sdk/rust/src/pdas.rs'), 'pdas.rs must exist');
  const pdas = read('sdk/rust/src/pdas.rs');

  for (const fnName of ['group_pda', 'member_pda', 'vault_pda', 'rotation_history_pda']) {
    assert.match(pdas, new RegExp(`pub\\s+fn\\s+${fnName}\\s*\\(`), `${fnName} missing`);
  }
  for (const seedName of ['GROUP_SEED', 'MEMBER_SEED', 'VAULT_SEED', 'ROTATION_SEED']) {
    assert.match(pdas, new RegExp(`susu::seeds::[\\s\\S]*${seedName}|pub\\s+use\\s+susu::seeds::[\\s\\S]*${seedName}`), `${seedName} must come from susu::seeds`);
  }
  for (const literal of ['b"group"', 'b"member"', 'b"vault"', 'b"rotation"']) {
    assert.doesNotMatch(pdas, new RegExp(literal.replaceAll('"', '\\"')), `${literal} must not appear in pdas.rs`);
  }
});

test('Rust error enums mirror TS/program error surface', () => {
  assert.ok(existsSync('sdk/rust/src/errors.rs'), 'errors.rs must exist');
  const errors = read('sdk/rust/src/errors.rs');
  const programErrors = read('programs/susu/src/error.rs');

  assert.match(errors, /thiserror::Error/);
  assert.match(errors, /pub\s+enum\s+SusuError/);
  assert.match(errors, /pub\s+enum\s+SusuProgramError/);
  assert.match(errors, /Program\s*\(\s*SusuProgramError\s*\)/);
  assert.match(errors, /Simulation\s*\{/);
  assert.match(errors, /Rpc\s*\(/);
  assert.match(errors, /Cluster\s*\{/);
  assert.match(errors, /impl\s+From<solana_client::client_error::ClientError>\s+for\s+SusuError/);

  const variantMatches = [...programErrors.matchAll(/^\s*([A-Z][A-Za-z0-9]+),$/gm)].map((match) => match[1]);
  assert.ok(variantMatches.length >= 30, 'program error variants should be discovered');
  for (const variant of variantMatches) {
    assert.match(errors, new RegExp(`\\b${variant}\\b`), `${variant} missing from SusuProgramError`);
  }
  assert.match(errors, /6000/, 'Anchor custom error code base must be represented');
});

test('Rust PDA parity test has hard-coded vector and TS parity placeholder references same vector', () => {
  assert.ok(existsSync('sdk/rust/tests/parity.rs'), 'Rust parity test must exist');
  const rustParity = read('sdk/rust/tests/parity.rs');
  const tsParity = read('sdk/ts/tests/parity.test.ts');

  for (const token of ['EXPECTED_GROUP_PDA', 'EXPECTED_GROUP_BUMP', 'EXPECTED_MEMBER_PDA', 'EXPECTED_MEMBER_BUMP']) {
    assert.match(rustParity, new RegExp(token), `${token} missing`);
  }
  assert.match(rustParity, /group_pda\(/);
  assert.match(rustParity, /member_pda\(/);
  assert.match(tsParity, /Story 6\.4 PDA parity vector|EXPECTED_GROUP_PDA/);
});

test('Codama Rust fallback status documents Story 6.4 hand-rolled helpers', () => {
  const status = read('docs/codama-rust-status.md');

  assert.match(status, /Status:\s*`fallback`/);
  assert.match(status, /Story 6\.4/);
  assert.match(status, /hand-rolled/i);
  assert.match(status, /sdk\/rust\/src\/generated/);
});
