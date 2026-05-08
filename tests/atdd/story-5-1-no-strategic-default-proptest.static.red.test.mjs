import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const invariantPath = 'tests/invariants/no_strategic_default.rs';
const cargoTargetPath = 'programs/susu/tests/no_strategic_default.rs';
const curvePath = 'programs/susu/src/curve.rs';
const ciPath = '.github/workflows/ci.yml';

test('Story 5.1 exposes the audit-path no strategic default proptest', () => {
  assert.ok(existsSync(invariantPath), 'tests/invariants/no_strategic_default.rs must exist');
  const source = readFileSync(invariantPath, 'utf8');

  assert.match(source, /proptest!\s*\{/, 'invariant must use the proptest! macro');
  assert.match(source, /const\s+CASES\s*:\s*u32\s*=\s*10_000|cases\s*:\s*10_000|cases\s*:\s*10000/, 'must execute at least 10,000 proptest cases');
  assert.match(source, /3u8\s*\.\.=\s*12|3\s*\.\.=\s*12u8/, 'must sample n in [3, 12]');
  assert.match(source, /MIN_CONTRIBUTION_BASE_UNITS\s*:\s*u64\s*=\s*10_000_000/, 'must define the $10 lower bound at 6 decimals');
  assert.match(source, /MAX_CONTRIBUTION_BASE_UNITS\s*:\s*u64\s*=\s*10_000_000_000/, 'must define the $10,000 upper bound at 6 decimals');
  assert.match(source, /MIN_CONTRIBUTION_BASE_UNITS\s*\.\.=\s*MAX_CONTRIBUTION_BASE_UNITS/, 'must sample $10-$10,000 at 6 decimals');
  assert.match(source, /0u8\s*\.\.\s*n|0\s*\.\.\s*n/, 'must sample slot in [0, n)');
  assert.match(source, /USDC/i, 'must represent the USDC 6-decimal mint');
  assert.match(source, /USDT/i, 'must represent the USDT 6-decimal mint');
  assert.match(source, /expected_default_payoff/, 'must call the canonical expected_default_payoff API');
  assert.match(source, /prop_assert!\s*\(\s*payoff\s*<\s*0/, 'must assert defection payoff is strictly negative');
  assert.match(source, /n=.*slot=.*contribution=.*expected_payoff=/s, 'counterexample message must include the required tuple fields');
  assert.doesNotMatch(source, /2\s*\*\s*n|checked_add\(n|checked_mul\(factor|calculate_collateral\(/, 'invariant must not duplicate collateral curve math');
});

test('Story 5.1 has a Cargo-addressable no_strategic_default integration target', () => {
  assert.ok(existsSync(cargoTargetPath), 'programs/susu/tests/no_strategic_default.rs must exist');
  const source = readFileSync(cargoTargetPath, 'utf8');
  assert.match(source, /include!\s*\(/, 'Cargo target should include the audit-path invariant source');
  assert.match(source, /tests\/invariants\/no_strategic_default\.rs/, 'Cargo target must point at tests/invariants/no_strategic_default.rs');
});

test('Story 5.1 curve module exposes canonical expected_default_payoff helper', () => {
  const source = readFileSync(curvePath, 'utf8');
  assert.match(source, /pub\s+fn\s+expected_default_payoff\s*\(/, 'curve.rs must expose expected_default_payoff');
  assert.match(source, /calculate_collateral\s*\(/, 'expected_default_payoff must derive from calculate_collateral');
  assert.match(source, /Result\s*<\s*i128\s*,\s*SusuError\s*>/, 'expected_default_payoff must return signed payoff result');
  assert.match(source, /checked_/g, 'expected_default_payoff must use checked arithmetic');
});

test('Story 5.1 runs release-mode invariant proof in CI', () => {
  const source = readFileSync(ciPath, 'utf8');
  assert.match(source, /cargo test --test no_strategic_default --release/, 'ci.yml must run the release-mode invariant target');
});
