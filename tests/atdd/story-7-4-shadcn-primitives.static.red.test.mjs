import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = 'apps/reference';
const uiDir = `${appRoot}/components/ui`;
const utilsPath = `${appRoot}/lib/utils.ts`;
const previewPagePath = `${appRoot}/app/[locale]/dev/components/page.tsx`;
const packageJsonPath = `${appRoot}/package.json`;

const PRIMITIVES = [
  'button',
  'dialog',
  'input',
  'label',
  'textarea',
  'select',
  'combobox',
  'tooltip',
  'popover',
  'dropdown-menu',
  'tabs',
  'card',
  'badge',
  'toast',
  'skeleton',
  'switch',
  'checkbox',
  'radio-group',
  'progress',
  'avatar',
  'scroll-area',
  'separator',
];

// Interactive primitives that MUST wire focus-visible rings (UX-DR28).
const INTERACTIVE = new Set([
  'button',
  'input',
  'textarea',
  'select',
  'combobox',
  'dropdown-menu',
  'tabs',
  'switch',
  'checkbox',
  'radio-group',
  'dialog',
  'popover',
]);

function read(p) {
  return readFileSync(p, 'utf8');
}

function assertExists(p) {
  assert.ok(existsSync(p), `${p} must exist`);
}

test('Story 7.4 cn() utility exists at lib/utils.ts using clsx + tailwind-merge', () => {
  assertExists(utilsPath);
  const src = read(utilsPath);
  assert.match(src, /from\s+["']clsx["']/, 'lib/utils.ts must import clsx');
  assert.match(src, /from\s+["']tailwind-merge["']/, 'lib/utils.ts must import tailwind-merge');
  assert.match(src, /export\s+function\s+cn\b|export\s+const\s+cn\b/, 'lib/utils.ts must export cn');
});

test('Story 7.4 declares Radix + cva + clsx + tailwind-merge peer deps in apps/reference/package.json', () => {
  const pkg = JSON.parse(read(packageJsonPath));
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  for (const dep of [
    '@radix-ui/react-dialog',
    '@radix-ui/react-label',
    '@radix-ui/react-avatar',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-tooltip',
    '@radix-ui/react-popover',
    '@radix-ui/react-select',
    '@radix-ui/react-tabs',
    '@radix-ui/react-switch',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-radio-group',
    '@radix-ui/react-progress',
    '@radix-ui/react-scroll-area',
    '@radix-ui/react-separator',
    '@radix-ui/react-slot',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
  ]) {
    assert.ok(deps[dep], `apps/reference/package.json must depend on ${dep}`);
  }
});

test('Story 7.4 components/ui/ contains all 21 shadcn primitives from UX-DR24', () => {
  for (const name of PRIMITIVES) {
    assertExists(`${uiDir}/${name}.tsx`);
  }
});

test('Story 7.4 every primitive uses semantic Tailwind tokens — no hardcoded colors', () => {
  // Forbidden: Tailwind palette color classes (bg-red-500, text-blue-100, …).
  const forbiddenPalette =
    /\b(?:bg|text|border|ring|outline|fill|stroke|from|to|via|placeholder|caret|accent|decoration|divide|shadow)-(?:red|blue|green|gray|zinc|slate|neutral|stone|amber|emerald|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|orange|yellow|lime|teal)-\d{2,3}\b/;
  // Forbidden: hex literals, rgb()/hsl() literals (excluding rgb(var(--…))).
  const forbiddenHex = /#[0-9a-fA-F]{3,8}\b/;
  const forbiddenRgb = /\b(?:rgb|hsl)\s*\(\s*\d/;

  // Required: at least one Susu token-class reference per primitive
  // (bg-surface | bg-bg | bg-primary | text-text | border-border | ring-signal | etc.).
  const requiredToken =
    /\b(?:bg|text|border|ring|outline|placeholder|fill|stroke|shadow)-(?:bg|surface|surface2|border|text|muted|primary|secondary|signal|warn|danger)\b/;

  for (const name of PRIMITIVES) {
    const path = `${uiDir}/${name}.tsx`;
    const src = read(path);

    const paletteHit = src.match(forbiddenPalette);
    assert.ok(
      !paletteHit,
      `${path} contains a hardcoded Tailwind color class (${paletteHit?.[0]}) — must use semantic tokens like bg-surface/text-text`,
    );

    const hexHit = src.match(forbiddenHex);
    assert.ok(
      !hexHit,
      `${path} contains a hex color literal (${hexHit?.[0]}) — colors must come from CSS custom properties`,
    );

    const rgbHit = src.match(forbiddenRgb);
    assert.ok(
      !rgbHit,
      `${path} contains a raw rgb()/hsl() literal — use rgb(var(--token)) via Tailwind token classes`,
    );

    assert.match(
      src,
      requiredToken,
      `${path} must reference at least one Susu semantic token class (e.g., bg-surface, text-text, border-border)`,
    );
  }
});

test('Story 7.4 Button declares all five variants (primary, secondary, ghost, destructive, link) per UX-DR38', () => {
  const src = read(`${uiDir}/button.tsx`);
  for (const variant of ['primary', 'secondary', 'ghost', 'destructive', 'link']) {
    assert.ok(
      src.includes(`${variant}:`) || src.includes(`"${variant}"`) || src.includes(`'${variant}'`),
      `button.tsx must declare the "${variant}" variant`,
    );
  }
});

test('Story 7.4 Button declares size variants sm/md/lg meeting the WCAG 2.5.5 44px floor (raised by Story 7.17)', () => {
  const src = read(`${uiDir}/button.tsx`);
  // Story 7.17 lifted the size variants from 32 / 40 / 48 to 44 / 48 / 56 px
  // to honour WCAG 2.5.5 (44 × 44 minimum touch target). The Tailwind 4px
  // scale gives h-11 (44px) / h-12 (48px) / h-14 (56px).
  for (const cls of ['h-11', 'h-12', 'h-14']) {
    assert.ok(src.includes(cls), `button.tsx must include the ${cls} class for size variants`);
  }
});

test('Story 7.4 every interactive primitive wires focus-visible rings to the --signal token (UX-DR28)', () => {
  const focusRingRx = /focus-visible:[^"'`]*?(?:ring-signal|ring-primary|outline-signal|outline-primary)/;
  for (const name of INTERACTIVE) {
    const src = read(`${uiDir}/${name}.tsx`);
    assert.match(
      src,
      focusRingRx,
      `${name}.tsx must wire a focus-visible:ring-signal (or ring-primary) class per UX-DR28`,
    );
  }
});

test('Story 7.4 dev component preview page exists and is gated behind NEXT_PUBLIC_DEV_PAGES', () => {
  assertExists(previewPagePath);
  const src = read(previewPagePath);
  // The preview page may either read the env flag directly via the
  // `process.env.NEXT_PUBLIC_DEV_PAGES` literal or via the parsed
  // `env.NEXT_PUBLIC_DEV_PAGES` re-export from `lib/env.ts` — both satisfy
  // UX-DR24 AC5. `lib/env.ts` is the single canonical reader per
  // `scripts/check-patterns.sh`.
  const referencesFlag =
    /NEXT_PUBLIC_DEV_PAGES/.test(src) ||
    (/from\s+["']@\/lib\/env["']/.test(src) && /env\.NEXT_PUBLIC_DEV_PAGES/.test(src));
  assert.ok(
    referencesFlag,
    'preview page must reference the NEXT_PUBLIC_DEV_PAGES env flag (directly or via lib/env)',
  );
  // Verify env.ts schema declares the flag too — covers the indirect path.
  const envSrc = read(`${appRoot}/lib/env.ts`);
  assert.match(envSrc, /NEXT_PUBLIC_DEV_PAGES/, 'lib/env.ts must declare NEXT_PUBLIC_DEV_PAGES');
  // Renders multiple primitives — sanity-check at least Button + Card.
  for (const ref of ['Button', 'Card']) {
    assert.ok(src.includes(ref), `preview page must render <${ref} />`);
  }
});
