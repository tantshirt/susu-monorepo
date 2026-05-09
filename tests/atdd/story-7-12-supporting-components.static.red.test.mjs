import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = 'apps/reference';
const susuDir = `${appRoot}/components/susu`;

const FILES = {
  CodeBlock: `${susuDir}/CodeBlock.tsx`,
  ReceiptCard: `${susuDir}/ReceiptCard.tsx`,
  Banner: `${susuDir}/Banner.tsx`,
  FieldError: `${susuDir}/FieldError.tsx`,
};

// Forbidden color literals — Story 7.2 token discipline (UX-DR2).
const FORBID_HEX = /#[0-9a-fA-F]{3,8}\b/;
const FORBID_RGB = /\brgb\(/;
const FORBID_HSL = /\bhsl\(/;
const FORBID_PALETTE =
  /\b(?:bg|text|border|ring|fill|stroke|from|to|via)-(?:red|blue|green|gray|zinc|slate|neutral|stone|amber|emerald|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|orange|yellow|lime|teal)-[0-9]{2,3}\b/;

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
  assert.doesNotMatch(src, FORBID_PALETTE, `${name} must not use Tailwind palette colors (use semantic tokens)`);
}

test('Story 7.12 each susu component file exists', () => {
  for (const [name, path] of Object.entries(FILES)) {
    assertExists(path);
  }
});

test('Story 7.12 CodeBlock exports component, uses font-mono, includes copy button', () => {
  const src = read(FILES.CodeBlock);
  assert.match(
    src,
    /export\s+(?:default\s+)?(?:function|const)\s+CodeBlock\b/,
    'CodeBlock.tsx must export a CodeBlock component',
  );
  assert.match(src, /\bfont-mono\b/, 'CodeBlock.tsx must use the font-mono typography token (UX-DR19)');
  assert.ok(
    /copy/i.test(src) && /clipboard/i.test(src),
    'CodeBlock.tsx must surface a copy-to-clipboard affordance (UX-DR19)',
  );
  assertNoHardcodedColors('CodeBlock.tsx', src);
});

test('Story 7.12 ReceiptCard exports component, builds on Card, links to explorer via cluster from lib/env', () => {
  const src = read(FILES.ReceiptCard);
  assert.match(
    src,
    /export\s+(?:default\s+)?(?:function|const)\s+ReceiptCard\b/,
    'ReceiptCard.tsx must export a ReceiptCard component',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/ui\/card["']/,
    'ReceiptCard.tsx must build on the shadcn Card primitive',
  );
  assert.match(
    src,
    /from\s+["']@\/lib\/env["']/,
    'ReceiptCard.tsx must import env from @/lib/env (single source of truth)',
  );
  assert.match(
    src,
    /NEXT_PUBLIC_CLUSTER/,
    'ReceiptCard.tsx must use NEXT_PUBLIC_CLUSTER for explorer URL (no hardcoded cluster)',
  );
  assert.match(
    src,
    /explorer\.solana\.com|solscan\.io|solana\.fm/i,
    'ReceiptCard.tsx must link transactions to a Solana explorer',
  );
  assertNoHardcodedColors('ReceiptCard.tsx', src);
});

test('Story 7.12 Banner exports component with all four variants and uses token classes', () => {
  const src = read(FILES.Banner);
  assert.match(
    src,
    /export\s+(?:default\s+)?(?:function|const)\s+Banner\b/,
    'Banner.tsx must export a Banner component',
  );
  for (const variant of ['info', 'warn', 'danger', 'success']) {
    assert.ok(
      src.includes(`"${variant}"`) || src.includes(`'${variant}'`),
      `Banner.tsx must declare the "${variant}" variant`,
    );
  }
  // Must surface at least one of bg-warn / bg-danger token classes (UX-DR22).
  assert.match(
    src,
    /\bbg-(?:warn|danger|signal|surface|surface2)\b/,
    'Banner.tsx must use semantic token color classes (e.g. bg-warn / bg-danger)',
  );
  assertNoHardcodedColors('Banner.tsx', src);
});

test('Story 7.12 FieldError exports component with text-danger + text-caption tokens', () => {
  const src = read(FILES.FieldError);
  assert.match(
    src,
    /export\s+(?:default\s+)?(?:function|const)\s+FieldError\b/,
    'FieldError.tsx must export a FieldError component',
  );
  assert.match(src, /\btext-danger\b/, 'FieldError.tsx must use the text-danger token (UX-DR23)');
  assert.match(src, /\btext-caption\b/, 'FieldError.tsx must use the text-caption typography token');
  assertNoHardcodedColors('FieldError.tsx', src);
});
