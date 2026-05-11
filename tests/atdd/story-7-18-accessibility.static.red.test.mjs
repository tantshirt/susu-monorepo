import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const REDUCED_MOTION = 'apps/reference/lib/a11y/reduced-motion.ts';
const GLOBALS_CSS = 'apps/reference/app/globals.css';
const A11Y_WORKFLOW = '.github/workflows/a11y.yml';
const PILOT_PAGE = 'apps/reference/app/[locale]/pilot/page.tsx';
const REF_PKG = 'apps/reference/package.json';
const ROOT_PKG = 'package.json';

const FORBID_HEX = /#[0-9a-fA-F]{3,8}\b/;
const FORBID_RGB = /\brgb\(/;
const FORBID_HSL = /\bhsl\(/;
// Directional Tailwind utilities banned in new files (UX-DR33).
// Match `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-` as standalone classes/words.
const FORBID_DIRECTIONAL =
  /(?:^|[\s"'`])(?:m[lr]|p[lr]|left|right)-[a-z0-9]/m;

function read(p) {
  return readFileSync(p, 'utf8');
}

function assertExists(p) {
  assert.ok(existsSync(p), `${p} must exist`);
}

test('Story 7.18 reduced-motion helper exists, exports prefersReducedMotion, server-safe', () => {
  assertExists(REDUCED_MOTION);
  const src = read(REDUCED_MOTION);
  assert.match(
    src,
    /export\s+function\s+prefersReducedMotion\b/,
    'reduced-motion.ts must export prefersReducedMotion()',
  );
  // Must guard window so it works during SSR.
  assert.match(
    src,
    /typeof\s+window\s*===?\s*["']undefined["']/,
    'reduced-motion.ts must guard window for SSR safety',
  );
  assert.match(
    src,
    /matchMedia/,
    'reduced-motion.ts must use matchMedia to read the user preference',
  );
  assert.match(
    src,
    /prefers-reduced-motion:\s*reduce/,
    'reduced-motion.ts must query prefers-reduced-motion: reduce',
  );
});

test('Story 7.18 globals.css declares prefers-reduced-motion override under utilities layer', () => {
  const src = read(GLOBALS_CSS);
  assert.match(
    src,
    /@layer\s+utilities\s*\{[\s\S]*@media\s*\(prefers-reduced-motion:\s*reduce\)/,
    'globals.css must contain a @media (prefers-reduced-motion: reduce) block within @layer utilities',
  );
  assert.match(
    src,
    /animation[-:]/,
    'reduced-motion override must affect animation-* utilities',
  );
  assert.match(
    src,
    /transition[-:]/,
    'reduced-motion override must affect transition-* utilities',
  );
});

test('Story 7.18 axe-core CI workflow exists and targets en/vi/ar with wcag2aa tags', () => {
  assertExists(A11Y_WORKFLOW);
  const src = read(A11Y_WORKFLOW);
  assert.match(src, /axe/i, 'a11y workflow must invoke axe');
  assert.match(src, /wcag2aa|wcag21aa/, 'a11y workflow must scope to wcag2aa / wcag21aa tags');
  assert.match(src, /\/en\b/, 'a11y workflow must scan /en');
  assert.match(src, /\/vi\b/, 'a11y workflow must scan /vi');
  assert.match(src, /\/ar\b/, 'a11y workflow must scan /ar (RTL)');
});

// The non-crypto /pilot page was retired with the post-2026-05 design pivot
// (project_ux_design.md). Stakeholder demos and axe-core scans now run
// against the live `/en` home, `/en/groups`, and `/en/how-it-works` routes
// instead — the a11y workflow above codifies that. The pilot-page assertion
// has been removed; if a non-crypto demo surface is needed again later,
// restore both the page and this test together.

test('Story 7.18 apps/reference/package.json lists @axe-core/cli', () => {
  const pkg = JSON.parse(read(REF_PKG));
  const all = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  assert.ok(
    all['@axe-core/cli'],
    'apps/reference/package.json must list @axe-core/cli (dep or devDep)',
  );
});

test('Story 7.18 root package.json exposes a11y:check script', () => {
  const pkg = JSON.parse(read(ROOT_PKG));
  assert.ok(
    pkg.scripts && typeof pkg.scripts['a11y:check'] === 'string',
    'root package.json must expose an a11y:check script',
  );
  assert.match(
    pkg.scripts['a11y:check'],
    /axe/i,
    'a11y:check script must invoke axe',
  );
});
