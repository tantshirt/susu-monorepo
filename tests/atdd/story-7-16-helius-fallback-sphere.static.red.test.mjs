import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = 'apps/reference';
const FILES = {
  getRpcUrl: `${appRoot}/lib/rpc/getRpcUrl.ts`,
  rpcIndex: `${appRoot}/lib/rpc/index.ts`,
  isSphereEnabled: `${appRoot}/lib/sphere/isEnabled.ts`,
  onramp: `${appRoot}/components/sphere/OnrampButton.tsx`,
  env: `${appRoot}/lib/env.ts`,
};

const FORBID_HEX = /#[0-9a-fA-F]{3,8}\b/;
const FORBID_RGB = /\brgb\(/;
const FORBID_HSL = /\bhsl\(/;
const FORBID_PALETTE =
  /\b(?:bg|text|border|ring|fill|stroke|from|to|via)-(?:red|blue|green|gray|zinc|slate|neutral|stone|amber|emerald|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|orange|yellow|lime|teal)-[0-9]{2,3}\b/;
const FORBID_DIRECTIONAL = /\b(?:left|right)-[0-9]+\b/;

function read(p) {
  return readFileSync(p, 'utf8');
}

/**
 * Strip /* ... *\/ block comments and // line comments before scanning for
 * forbidden tokens like `window`. Doc comments often reference the very
 * thing we forbid in code (e.g. "no window references"), so we only scan
 * non-comment source.
 */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function assertExists(p) {
  assert.ok(existsSync(p), `${p} must exist`);
}

test('Story 7.16 every required file exists', () => {
  for (const [name, path] of Object.entries(FILES)) {
    assertExists(path);
  }
});

test('Story 7.16 getRpcUrl exports the function and centralises the fallback chain', () => {
  const src = read(FILES.getRpcUrl);
  assert.match(
    src,
    /export\s+(?:function|const)\s+getRpcUrl\b/,
    'getRpcUrl.ts must export a getRpcUrl function',
  );
  assert.match(
    src,
    /from\s+["']@\/lib\/env["']/,
    'getRpcUrl.ts must import env from @/lib/env (single source of truth)',
  );
  assert.match(
    src,
    /api\.devnet\.solana\.com/,
    'getRpcUrl.ts must contain the public devnet fallback URL',
  );
  assert.match(
    src,
    /api\.mainnet-beta\.solana\.com/,
    'getRpcUrl.ts must contain the public mainnet-beta fallback URL',
  );
  assert.match(
    src,
    /localhost:8899/,
    'getRpcUrl.ts must contain the localnet fallback URL',
  );
  assert.match(
    src,
    /console\.warn/,
    'getRpcUrl.ts must console.warn when falling back to public RPC',
  );
  assert.doesNotMatch(
    stripComments(src),
    /\bwindow\b/,
    'getRpcUrl.ts must be server-safe (no window references)',
  );
});

test('Story 7.16 rpc/index re-exports getRpcUrl and exposes createRpcClient placeholder', () => {
  const src = read(FILES.rpcIndex);
  assert.match(
    src,
    /getRpcUrl/,
    'lib/rpc/index.ts must re-export getRpcUrl',
  );
  assert.match(
    src,
    /createRpcClient/,
    'lib/rpc/index.ts must export a createRpcClient placeholder',
  );
});

test('Story 7.16 only getRpcUrl.ts hardcodes RPC URLs', () => {
  const otherFiles = [FILES.rpcIndex, FILES.isSphereEnabled, FILES.onramp];
  for (const path of otherFiles) {
    const src = read(path);
    assert.doesNotMatch(
      src,
      /api\.devnet\.solana\.com|api\.mainnet-beta\.solana\.com|localhost:8899/,
      `${path} must not hardcode RPC URLs (only lib/rpc/getRpcUrl.ts may)`,
    );
  }
});

test('Story 7.16 isSphereEnabled returns boolean derived from env', () => {
  const src = read(FILES.isSphereEnabled);
  assert.match(
    src,
    /export\s+(?:function|const)\s+isSphereEnabled\b/,
    'isEnabled.ts must export an isSphereEnabled function',
  );
  assert.match(
    src,
    /from\s+["']@\/lib\/env["']/,
    'isEnabled.ts must import env from @/lib/env',
  );
  assert.match(
    src,
    /NEXT_PUBLIC_SPHERE_ENABLED/,
    'isEnabled.ts must reference NEXT_PUBLIC_SPHERE_ENABLED',
  );
  assert.doesNotMatch(
    stripComments(src),
    /\bwindow\b/,
    'isEnabled.ts must be server-safe (no window references)',
  );
});

test('Story 7.16 OnrampButton is a Client Component, gated, and uses secondary Button', () => {
  const src = read(FILES.onramp);
  assert.match(
    src,
    /^["']use client["'];?/m,
    'OnrampButton.tsx must declare "use client"',
  );
  assert.match(
    src,
    /from\s+["']@\/lib\/sphere\/isEnabled["']/,
    'OnrampButton.tsx must import isSphereEnabled',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/ui\/button["']/,
    'OnrampButton.tsx must build on the shadcn Button primitive',
  );
  assert.match(
    src,
    /variant=["']secondary["']/,
    'OnrampButton.tsx must render the Button with variant="secondary"',
  );
  assert.match(
    src,
    /On-ramp via Sphere/,
    'OnrampButton.tsx must surface the placeholder "On-ramp via Sphere" label',
  );
  assert.match(
    src,
    /return\s+null/,
    'OnrampButton.tsx must return null when Sphere is disabled',
  );
  assert.match(
    src,
    /TODO/,
    'OnrampButton.tsx must include a TODO comment for the future Sphere integration',
  );
  assert.doesNotMatch(src, FORBID_HEX, 'OnrampButton.tsx must not use hex literals');
  assert.doesNotMatch(src, FORBID_RGB, 'OnrampButton.tsx must not use rgb() literals');
  assert.doesNotMatch(src, FORBID_HSL, 'OnrampButton.tsx must not use hsl() literals');
  assert.doesNotMatch(
    src,
    FORBID_PALETTE,
    'OnrampButton.tsx must not use Tailwind palette colors (use semantic tokens)',
  );
  assert.doesNotMatch(
    src,
    FORBID_DIRECTIONAL,
    'OnrampButton.tsx must use logical Tailwind classes (start-*/end-*) not directional left-*/right-*',
  );
});

test('Story 7.16 env.ts defaults NEXT_PUBLIC_SPHERE_ENABLED to "false"', () => {
  const src = read(FILES.env);
  // Look for the SPHERE block having a `.default("false")` somewhere in
  // its chained schema.
  const sphereBlockMatch = src.match(
    /NEXT_PUBLIC_SPHERE_ENABLED[\s\S]*?\.transform\(/,
  );
  assert.ok(sphereBlockMatch, 'env.ts must declare NEXT_PUBLIC_SPHERE_ENABLED schema');
  assert.match(
    sphereBlockMatch[0],
    /\.default\(["']false["']\)/,
    'NEXT_PUBLIC_SPHERE_ENABLED must default to "false" so prod builds without the flag work cleanly',
  );
});
