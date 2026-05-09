import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = 'apps/reference';
const modalPath = `${appRoot}/components/susu/TransactionConfirmModal.tsx`;
const simBlockPath = `${appRoot}/components/susu/SimulationResultBlock.tsx`;
const toastQueuePath = `${appRoot}/lib/tx/toast-queue.tsx`;
const txTypesPath = `${appRoot}/lib/tx/types.ts`;
const pkgPath = `${appRoot}/package.json`;
const localeLayoutPath = `${appRoot}/app/[locale]/layout.tsx`;

// Directional classes forbidden — Story 7.7 / a11y RTL discipline (UX-DR40).
const FORBID_DIRECTIONAL =
  /\b(?:left|right|pl|pr|ml|mr|border-l|border-r|rounded-l|rounded-r)-(?:\d+|\[?\w+\]?)\b/;

// Token discipline — Story 7.2 (UX-DR2).
const FORBID_HEX = /#[0-9a-fA-F]{3,8}\b/;

function read(p) {
  return readFileSync(p, 'utf8');
}

function assertExists(p) {
  assert.ok(existsSync(p), `${p} must exist`);
}

function assertNoDirectional(name, src) {
  // Strip JS-style block / line comments and string literals containing URLs
  // before scanning so we don't trip on `// right-…` comments.
  assert.doesNotMatch(
    src,
    FORBID_DIRECTIONAL,
    `${name} must not contain directional Tailwind classes (use logical start-/end-/ps-/pe-)`,
  );
}

test('Story 7.10 TransactionConfirmModal.tsx exists with expected shape', () => {
  assertExists(modalPath);
  const src = read(modalPath);
  assert.match(src, /^"use client";/m, 'TransactionConfirmModal must be a Client Component');
  assert.match(
    src,
    /export\s+(?:default\s+)?(?:function|const)\s+TransactionConfirmModal\b/,
    'TransactionConfirmModal must export a TransactionConfirmModal component',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/ui\/dialog["']/,
    'TransactionConfirmModal must import Dialog from the shadcn primitive',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/susu\/ReceiptCard["']/,
    'TransactionConfirmModal must render ReceiptCard on success',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/susu\/Banner["']/,
    'TransactionConfirmModal must surface warnings/errors via Banner',
  );
  for (const prop of ['buildTx', 'simulate', 'submit']) {
    assert.ok(src.includes(prop), `TransactionConfirmModal must reference the ${prop} prop`);
  }
  for (const state of [
    'idle',
    'building',
    'simulating',
    'ready-to-submit',
    'submitting',
    'done',
    'failed',
  ]) {
    assert.ok(
      src.includes(`"${state}"`) || src.includes(`'${state}'`),
      `TransactionConfirmModal state machine must include the ${state} state`,
    );
  }
  assertNoDirectional('TransactionConfirmModal.tsx', src);
  assert.doesNotMatch(src, FORBID_HEX, 'TransactionConfirmModal must not hardcode hex colors');
});

test('Story 7.10 SimulationResultBlock.tsx exists with collapsible logs and aria-live', () => {
  assertExists(simBlockPath);
  const src = read(simBlockPath);
  assert.match(
    src,
    /export\s+(?:default\s+)?(?:function|const)\s+SimulationResultBlock\b/,
    'SimulationResultBlock must export a SimulationResultBlock component',
  );
  assert.match(
    src,
    /<details\b/,
    'SimulationResultBlock must use a <details> element for collapsible logs',
  );
  assert.match(
    src,
    /aria-live=["']polite["']/,
    'SimulationResultBlock must declare aria-live="polite"',
  );
  assertNoDirectional('SimulationResultBlock.tsx', src);
});

test('Story 7.10 toast-queue.tsx exists with provider, hook, and viewport', () => {
  assertExists(toastQueuePath);
  const src = read(toastQueuePath);
  assert.match(src, /^"use client";/m, 'toast-queue must be a Client Component');
  assert.match(
    src,
    /export\s+(?:function|const)\s+ToastQueueProvider\b/,
    'toast-queue must export ToastQueueProvider',
  );
  assert.match(
    src,
    /export\s+(?:function|const)\s+useToastQueue\b/,
    'toast-queue must export useToastQueue hook',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/ui\/toast["']/,
    'toast-queue must wrap the shadcn Toast surface',
  );
  assertNoDirectional('toast-queue.tsx', src);
});

test('Story 7.10 lib/tx/types.ts re-exports SusuError types from @susu/sdk', () => {
  assertExists(txTypesPath);
  const src = read(txTypesPath);
  assert.match(
    src,
    /from\s+["']@susu\/sdk(?:\/errors)?["']/,
    'lib/tx/types.ts must import SusuError types from @susu/sdk',
  );
  assert.match(src, /SusuError/, 'lib/tx/types.ts must reference SusuError');
});

test('Story 7.10 reference app package.json declares @solana/kit and @susu/sdk', () => {
  const pkg = JSON.parse(read(pkgPath));
  const deps = pkg.dependencies ?? {};
  assert.ok(deps['@solana/kit'], '@solana/kit must be a runtime dependency');
  assert.ok(deps['@susu/sdk'], '@susu/sdk must be a runtime dependency');
});

test('Story 7.10 locale layout mounts the ToastQueueProvider', () => {
  const src = read(localeLayoutPath);
  assert.match(
    src,
    /ToastQueueProvider/,
    'app/[locale]/layout.tsx must mount the ToastQueueProvider so the viewport renders',
  );
});
