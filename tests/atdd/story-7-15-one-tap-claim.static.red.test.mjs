import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = 'apps/reference';
const routeDir = `${appRoot}/app/[locale]/groups/[groupPda]/claim`;

const FILES = {
  page: `${routeDir}/page.tsx`,
  client: `${routeDir}/ClaimClient.tsx`,
  claim: `${appRoot}/lib/susu/claim.ts`,
};

const LOCALE_FILES = ['en', 'vi', 'ar', 'es', 'yo', 'ht-kreyol'].map(
  (loc) => `${appRoot}/messages/${loc}.json`,
);

const REQUIRED_KEYS = [
  'buttonLabel',
  'connectPrompt',
  'modalTitle',
  'modalDescription',
  'receiptTitle',
  'nextStepsLead',
  'notRecipient',
  'preDeadline',
  'alreadyClaimed',
];

const FORBID_HEX = /#[0-9a-fA-F]{3,8}\b/;
const FORBID_RGB = /\brgb\(/;
const FORBID_HSL = /\bhsl\(/;
const FORBID_PALETTE =
  /\b(?:bg|text|border|ring|fill|stroke|from|to|via)-(?:red|blue|green|gray|zinc|slate|neutral|stone|amber|emerald|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|orange|yellow|lime|teal)-[0-9]{2,3}\b/;
const FORBID_HARDCODED_RPC =
  /https?:\/\/(?:api\.(?:mainnet-beta|devnet|testnet)\.solana\.com|[a-z0-9-]+\.helius-rpc\.com)\b/i;
// Directional Tailwind utilities must use logical equivalents (UX-DR — RTL safety).
const FORBID_DIRECTIONAL =
  /\b(?:ml|mr|pl|pr|left|right|rounded-l|rounded-r|border-l|border-r|text-(?:left|right))-/;

function read(p) {
  return readFileSync(p, 'utf8');
}

function assertExists(p) {
  assert.ok(existsSync(p), `${p} must exist`);
}

function assertNoHardcodedColors(name, src) {
  assert.doesNotMatch(src, FORBID_HEX, `${name} must not contain hex color literals`);
  assert.doesNotMatch(src, FORBID_RGB, `${name} must not contain rgb() literals`);
  assert.doesNotMatch(src, FORBID_HSL, `${name} must not contain hsl() literals`);
  assert.doesNotMatch(
    src,
    FORBID_PALETTE,
    `${name} must not use Tailwind palette colors (use semantic tokens)`,
  );
  assert.doesNotMatch(
    src,
    FORBID_HARDCODED_RPC,
    `${name} must route RPC URLs through getRpcUrl() (no hardcoded endpoints)`,
  );
}

function assertNoDirectionalTailwind(name, src) {
  assert.doesNotMatch(
    src,
    FORBID_DIRECTIONAL,
    `${name} must use logical Tailwind utilities (ms/me/ps/pe/start/end), not directional ones`,
  );
}

test('Story 7.15 claim route page exists and reads route params', () => {
  assertExists(FILES.page);
  const src = read(FILES.page);
  assert.match(
    src,
    /from\s+["']\.\/ClaimClient["']/,
    'page.tsx must import ClaimClient from a sibling module',
  );
  assert.match(
    src,
    /\bgroupPda\b/,
    'page.tsx must reference the groupPda route parameter',
  );
  assertNoHardcodedColors('page.tsx', src);
  assertNoDirectionalTailwind('page.tsx', src);
});

test('Story 7.15 ClaimClient is a client component with required imports', () => {
  assertExists(FILES.client);
  const src = read(FILES.client);
  assert.match(
    src,
    /^\s*["']use client["']/m,
    'ClaimClient.tsx must be a Client Component ("use client")',
  );
  assert.match(
    src,
    /from\s+["']@\/lib\/wallet\/useWallet["']/,
    'ClaimClient.tsx must import useWallet from @/lib/wallet/useWallet',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/susu\/TransactionConfirmModal["']/,
    'ClaimClient.tsx must import the Story 7.10 TransactionConfirmModal',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/susu\/RotationCard["']/,
    'ClaimClient.tsx must import the Story 7.11 RotationCard',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/susu\/Banner["']/,
    'ClaimClient.tsx must import the Story 7.12 Banner for guard messages',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/susu\/ReceiptCard["']/,
    'ClaimClient.tsx must import ReceiptCard for the already-claimed branch',
  );
  // Three guard semantics — recipient match, pre-deadline gate, already-claimed receipt.
  assert.match(
    src,
    /\brecipient\b/,
    'ClaimClient.tsx must reference the rotation recipient (recipient guard, Story 4.3)',
  );
  assert.match(
    src,
    /\b(?:claimDeadline|deadline)\b/,
    'ClaimClient.tsx must reference the claim deadline (pre-deadline guard, Story 4.4)',
  );
  assert.match(
    src,
    /\b(?:alreadyClaimed|priorClaim|priorSignature|claimedSignature)\b/,
    'ClaimClient.tsx must reference an already-claimed indicator (RotationReceipt guard, Story 4.5)',
  );
  assert.match(
    src,
    /\bconnected\b/,
    'ClaimClient.tsx must read the wallet `connected` flag to gate the Claim button',
  );
  assertNoHardcodedColors('ClaimClient.tsx', src);
  assertNoDirectionalTailwind('ClaimClient.tsx', src);
});

test('Story 7.15 lib/susu/claim.ts exports the three closure builders', () => {
  assertExists(FILES.claim);
  const src = read(FILES.claim);
  for (const fn of ['buildClaimTx', 'simulateClaim', 'submitClaim']) {
    assert.match(
      src,
      new RegExp(`export\\s+(?:async\\s+)?function\\s+${fn}\\b`),
      `lib/susu/claim.ts must export ${fn}`,
    );
  }
  assert.match(
    src,
    /from\s+["']@susu\/sdk["']/,
    'lib/susu/claim.ts must compose on top of @susu/sdk',
  );
  assert.match(
    src,
    /from\s+["']@\/lib\/rpc\/getRpcUrl["']/,
    'lib/susu/claim.ts must source the RPC URL via getRpcUrl()',
  );
  assertNoHardcodedColors('claim.ts', src);
});

test('Story 7.15 every locale file declares claim.* keys', () => {
  for (const path of LOCALE_FILES) {
    assertExists(path);
    const json = JSON.parse(read(path));
    assert.ok(
      json && typeof json === 'object' && json.claim && typeof json.claim === 'object',
      `${path} must declare a top-level "claim" message namespace`,
    );
    for (const key of REQUIRED_KEYS) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(json.claim, key) &&
          typeof json.claim[key] === 'string' &&
          json.claim[key].length > 0,
        `${path} must declare claim.${key} as a non-empty string`,
      );
    }
  }
});
