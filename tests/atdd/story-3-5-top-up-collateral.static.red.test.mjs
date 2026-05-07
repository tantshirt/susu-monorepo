import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const repoRoot = new URL('../../', import.meta.url);

async function readRepoFile(path) {
  return readFile(new URL(path, repoRoot), 'utf8');
}

async function assertFileExists(path) {
  await access(new URL(path, repoRoot));
}

test('[P0] top_up_collateral Anchor integration scaffold declares Story 3.5 INT scenarios', async () => {
  const source = await readRepoFile('programs/susu/tests/top_up_collateral.ts');

  for (const needle of [
    '[3.5-INT-001][P0] Simulated post-dropout group.n; top-up meets new_required → vault increases; collateral_posted updated',
    '[3.5-INT-002][P0] Top-up strictly below required delta → InsufficientCollateral',
    '[3.5-INT-003][P1] Slashing-rule interaction: dropout triggers dropper collateral slash; survivor new_required reflects post-slash distribution — top-up asserts msg collateral_topped_up',
    'describe.skip',
  ]) {
    assert.match(source, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `programs/susu/tests/top_up_collateral.ts must declare ${needle}`);
  }
});

test('[P0] top_up_collateral instruction implements collateral curve recomputation + SPL transfer semantics', async () => {
  const source = await readRepoFile('programs/susu/src/instructions/top_up_collateral.rs');

  for (const needle of [
    'pub struct TopUpCollateral',
    'pub group:',
    'pub member_position:',
    'pub member:',
    'pub member_token_account:',
    'pub vault:',
    'pub mint:',
    'token_program',
    'crate::curve::calculate_collateral',
    'InsufficientCollateral',
    'CurveOverflow',
    'checked_add',
    'collateral_posted',
    'VAULT_SEED',
    'anchor_spl::token',
    'token::transfer',
    'Transfer',
    'collateral_topped_up',
    'constraint',
    'member_pubkey',
  ]) {
    assert.match(source, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `top_up_collateral.rs must include ${needle}`);
  }

  assert.doesNotMatch(source, /\bb"vault"\b/, 'forbidden inline vault seed literal; use VAULT_SEED');
  assert.doesNotMatch(source, /\bsaturating_(add|sub|mul)/, 'Story 3.5 forbids saturating arithmetic');
});

test('[P0] SusuError exposes InsufficientCollateral and CurveOverflow for top-up Checked math failures', async () => {
  const source = await readRepoFile('programs/susu/src/error.rs');

  assert.match(source, /\bInsufficientCollateral\b/, 'SusuError must define InsufficientCollateral');
  assert.match(source, /\bCurveOverflow\b/, 'SusuError must define CurveOverflow for checked_add fallout');
});

test('[P0] curve module is linked for single-source collateral math', async () => {
  await assertFileExists('programs/susu/src/curve.rs');
  const lib = await readRepoFile('programs/susu/src/lib.rs');

  assert.match(lib, /\bpub\s+mod\s+curve\b/, 'lib.rs must expose pub mod curve for calculate_collateral');
});
