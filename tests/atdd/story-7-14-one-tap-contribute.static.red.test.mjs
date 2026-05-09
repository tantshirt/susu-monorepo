import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = 'apps/reference';
const routeDir = `${appRoot}/app/[locale]/groups/[groupPda]/contribute`;

const FILES = {
  page: `${routeDir}/page.tsx`,
  client: `${routeDir}/ContributeClient.tsx`,
  contribute: `${appRoot}/lib/susu/contribute.ts`,
};

const LOCALE_FILES = ['en', 'vi', 'ar', 'es', 'yo', 'ht-kreyol'].map(
  (loc) => `${appRoot}/messages/${loc}.json`,
);

const REQUIRED_KEYS = [
  'connectPrompt',
  'buttonLabel',
  'modalTitle',
  'modalDescription',
  'receiptTitle',
  'nextStepsLead',
];

const FORBID_HEX = /#[0-9a-fA-F]{3,8}\b/;
const FORBID_RGB = /\brgb\(/;
const FORBID_HSL = /\bhsl\(/;
const FORBID_PALETTE =
  /\b(?:bg|text|border|ring|fill|stroke|from|to|via)-(?:red|blue|green|gray|zinc|slate|neutral|stone|amber|emerald|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|orange|yellow|lime|teal)-[0-9]{2,3}\b/;
// Hardcoded RPC URLs are a frequent regression — Helius / public Solana endpoints.
const FORBID_HARDCODED_RPC =
  /https?:\/\/(?:api\.(?:mainnet-beta|devnet|testnet)\.solana\.com|[a-z0-9-]+\.helius-rpc\.com)\b/i;

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

test('Story 7.14 contribute route page exists and reads route params', () => {
  assertExists(FILES.page);
  const src = read(FILES.page);
  assert.match(
    src,
    /from\s+["']\.\/ContributeClient["']/,
    'page.tsx must import ContributeClient from a sibling module',
  );
  assert.match(
    src,
    /\bgroupPda\b/,
    'page.tsx must reference the groupPda route parameter',
  );
  assertNoHardcodedColors('page.tsx', src);
});

test('Story 7.14 ContributeClient is a client component with required imports', () => {
  assertExists(FILES.client);
  const src = read(FILES.client);
  assert.match(
    src,
    /^\s*["']use client["']/m,
    'ContributeClient.tsx must be a Client Component ("use client")',
  );
  assert.match(
    src,
    /from\s+["']@\/lib\/wallet\/useWallet["']/,
    'ContributeClient.tsx must import useWallet from @/lib/wallet/useWallet',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/susu\/TransactionConfirmModal["']/,
    'ContributeClient.tsx must import the Story 7.10 TransactionConfirmModal',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/susu\/RotationCard["']/,
    'ContributeClient.tsx must import the Story 7.11 RotationCard',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/susu\/Banner["']/,
    'ContributeClient.tsx must import the Story 7.12 Banner for the connect prompt',
  );
  assert.match(
    src,
    /\bconnected\b/,
    'ContributeClient.tsx must read the wallet `connected` flag to gate the Contribute button',
  );
  assertNoHardcodedColors('ContributeClient.tsx', src);
});

test('Story 7.14 lib/susu/contribute.ts exports the three closure builders', () => {
  assertExists(FILES.contribute);
  const src = read(FILES.contribute);
  for (const fn of ['buildContributeTx', 'simulateContribute', 'submitContribute']) {
    assert.match(
      src,
      new RegExp(`export\\s+(?:async\\s+)?function\\s+${fn}\\b`),
      `lib/susu/contribute.ts must export ${fn}`,
    );
  }
  assert.match(
    src,
    /from\s+["']@susu\/sdk["']/,
    'lib/susu/contribute.ts must compose on top of @susu/sdk',
  );
  assert.match(
    src,
    /from\s+["']@\/lib\/rpc\/getRpcUrl["']/,
    'lib/susu/contribute.ts must source the RPC URL via getRpcUrl()',
  );
  assertNoHardcodedColors('contribute.ts', src);
});

test('Story 7.14 every locale file declares contribute.* keys', () => {
  for (const path of LOCALE_FILES) {
    assertExists(path);
    const json = JSON.parse(read(path));
    assert.ok(
      json && typeof json === 'object' && json.contribute && typeof json.contribute === 'object',
      `${path} must declare a top-level "contribute" message namespace`,
    );
    for (const key of REQUIRED_KEYS) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(json.contribute, key) &&
          typeof json.contribute[key] === 'string' &&
          json.contribute[key].length > 0,
        `${path} must declare contribute.${key} as a non-empty string`,
      );
    }
  }
});
