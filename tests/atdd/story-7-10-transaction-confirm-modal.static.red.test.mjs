import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const repoRoot = new URL('../../', import.meta.url);

async function readRepoFile(path) {
  return readFile(new URL(path, repoRoot), 'utf8');
}

test('[P0] TransactionConfirmModal exposes typed descriptor, prepared transaction, and action variants', async () => {
  const source = await readRepoFile('components/susu/TransactionConfirmModal.tsx');

  assert.match(source, /export\s+type\s+TransactionActionType\s*=\s*'contribute'\s*\|\s*'claim'\s*\|\s*'top-up'\s*\|\s*'withdraw'\s*\|\s*'cancel-group'/);
  assert.match(source, /export\s+type\s+TransactionActionDescriptor/);
  assert.match(source, /preparedTransaction\s*:\s*PreparedTransaction/);
  assert.match(source, /sdk\s*:\s*TransactionSimulationSdk/);
  assert.match(source, /ACTION_VARIANTS/);
});

test('[P0] TransactionConfirmModal simulates on mount and gates confirm button until result', async () => {
  const source = await readRepoFile('components/susu/TransactionConfirmModal.tsx');

  assert.match(source, /simulateTransaction\(preparedTransaction\)/, 'modal must call SDK simulateTransaction on mount/open');
  assert.match(source, /simulationState\s*===\s*'loading'/, 'modal must expose loading simulation state');
  assert.match(source, /Will\s+succeed\s+✓/, 'modal must show success copy');
  assert.match(source, /Will\s+fail:\s*\{simulationReason\}/, 'modal must show failure copy with reason');
  assert.match(source, /disabled=\{!canConfirm\}/, 'confirm button must remain disabled until simulation returns success');
});

test('[P0] TransactionConfirmModal includes accessibility + responsive contract', async () => {
  const source = await readRepoFile('components/susu/TransactionConfirmModal.tsx');

  assert.match(source, /<dialog[\s\S]*aria-modal="true"/, 'modal must use dialog semantics with aria-modal=true');
  assert.match(source, /aria-live="polite"/, 'simulation result must be announced for screen readers');
  assert.match(source, /event\.key\s*===\s*'Escape'/, 'escape handling must be implemented');
  assert.match(source, /if\s*\(!isSigning\)/, 'escape close must be blocked while signing');
  assert.match(source, /max-width:\s*639px|maxWidth:\s*isMobile\s*\?\s*'100%'/, 'mobile fullscreen behavior must exist');
  assert.match(source, /truncateRecipient|slice\(0,\s*6\)/, 'recipient truncation must be present');
});

test('[P0] Playwright coverage includes success, failure, and mid-signing escape cases', async () => {
  const source = await readRepoFile('tests/playwright/transaction-confirm-modal.spec.ts');

  assert.match(source, /simulation-success path\s*→\s*sign\s*→\s*confirmed/);
  assert.match(source, /simulation-failure path\s*→\s*cannot confirm/);
  assert.match(source, /mid-signing state cannot escape/);
});
