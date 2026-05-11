import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * Story 7.17 — Mobile-first responsive layout + Playwright visual regression.
 *
 * Static red tests (no browser, no dev-server). They lock in the file-level
 * contract: Playwright config + visual spec + workflow + 44px-floor button +
 * mobile-hamburger TopNav + display-2 token. Behavioural assertions about
 * actual rendering at 360px live in the Playwright visual.spec — those run
 * informationally on the first PR while baselines are being established.
 */

const PLAYWRIGHT_CONFIG = 'apps/reference/playwright.config.ts';
const VISUAL_SPEC = 'apps/reference/tests/e2e/visual.spec.ts';
const VISUAL_WORKFLOW = '.github/workflows/visual.yml';
const REF_PKG = 'apps/reference/package.json';
const TOPNAV = 'apps/reference/components/TopNav.tsx';
const BUTTON = 'apps/reference/components/ui/button.tsx';
const TAILWIND_CONFIG = 'apps/reference/tailwind.config.ts';
const CONTRIBUTE_CLIENT =
  'apps/reference/app/[locale]/groups/[groupPda]/contribute/ContributeClient.tsx';
const CLAIM_CLIENT =
  'apps/reference/app/[locale]/groups/[groupPda]/claim/ClaimClient.tsx';

// Directional Tailwind utilities banned per UX-DR33.
const FORBID_DIRECTIONAL =
  /(?:^|[\s"'`])(?:m[lr]|p[lr]|left|right)-[a-z0-9]/m;

function read(p) {
  return readFileSync(p, 'utf8');
}

function assertExists(p) {
  assert.ok(existsSync(p), `${p} must exist`);
}

test('Story 7.17 playwright.config.ts exists and pins 360 / 768 / 1440 viewports', () => {
  assertExists(PLAYWRIGHT_CONFIG);
  const src = read(PLAYWRIGHT_CONFIG);
  assert.match(src, /defineConfig/, 'playwright.config.ts must use defineConfig');
  // 360 is the explicit Linh-handset floor — must appear verbatim.
  assert.match(src, /\b360\b/, 'playwright.config.ts must declare a 360px viewport');
  assert.match(src, /\b640\b/, 'playwright.config.ts must declare a 640px height for the 360 viewport');
  assert.match(src, /\b768\b/, 'playwright.config.ts must declare a 768px (tablet) viewport');
  assert.match(src, /\b1440\b/, 'playwright.config.ts must declare a 1440px (desktop) viewport');
  // The webServer block must run pnpm dev so visual specs hit a real Next server.
  assert.match(
    src,
    /webServer/,
    'playwright.config.ts must define a webServer block to spin up `next dev`',
  );
});

test('Story 7.17 visual.spec.ts exists and uses toHaveScreenshot for /en + /ar', () => {
  assertExists(VISUAL_SPEC);
  const src = read(VISUAL_SPEC);
  assert.match(src, /toHaveScreenshot/, 'visual.spec.ts must use Playwright toHaveScreenshot()');
  assert.match(src, /\/en\b/, 'visual.spec.ts must scan /en (LTR baseline)');
  assert.match(src, /\/ar\b/, 'visual.spec.ts must scan /ar (RTL baseline)');
});

test('Story 7.17 visual.yml workflow exists, runs Playwright, uploads diffs on failure', () => {
  assertExists(VISUAL_WORKFLOW);
  const src = read(VISUAL_WORKFLOW);
  assert.match(src, /playwright/i, 'visual.yml must run Playwright');
  assert.match(
    src,
    /upload-artifact/,
    'visual.yml must upload artifacts (diffs) on failure',
  );
  // paths filter must exclude doc-only changes.
  assert.match(
    src,
    /paths-ignore|paths:/,
    'visual.yml must define a paths/paths-ignore filter to skip doc-only PRs',
  );
});

test('Story 7.17 apps/reference/package.json exposes e2e:visual script', () => {
  const pkg = JSON.parse(read(REF_PKG));
  assert.ok(
    pkg.scripts && typeof pkg.scripts['e2e:visual'] === 'string',
    'apps/reference/package.json must expose an e2e:visual script',
  );
  assert.match(
    pkg.scripts['e2e:visual'],
    /playwright/,
    'e2e:visual script must invoke playwright',
  );
});

test('Story 7.17 TopNav.tsx wires the mobile DropdownMenu hamburger and keeps ClusterPill always visible', () => {
  const src = read(TOPNAV);
  assert.match(
    src,
    /from\s+["']@\/components\/ui\/dropdown-menu["']/,
    'TopNav must import DropdownMenu primitive for the mobile hamburger',
  );
  // The hamburger must collapse only at < md.
  assert.match(
    src,
    /md:hidden/,
    'TopNav must hide the hamburger on md+ (md:hidden)',
  );
  // Allow optional intervening utilities (e.g. `shrink-0`) between
  // `hidden` and `items-center` — the post-2026-05 quiet-luxury TopNav
  // refactor adds layout helpers there but preserves the contract that
  // the desktop control row is hidden below md and revealed at md+.
  assert.match(
    src,
    /hidden\b[^"'`]*\bitems-center\b[^"'`]*\bgap-\d+\b[^"'`]*\bmd:flex\b/,
    'TopNav must hide the desktop control row on < md (hidden md:flex)',
  );
  // ClusterPill must NOT live inside the collapsed wrapper. Its line
  // must precede the `md:hidden` wrapper line and not be a child of a
  // `hidden md:flex` block alone.
  const clusterIdx = src.indexOf('<ClusterPill');
  const hamburgerIdx = src.indexOf('md:hidden');
  assert.ok(clusterIdx > -1, 'TopNav must render <ClusterPill />');
  assert.ok(hamburgerIdx > -1, 'TopNav must render the md:hidden hamburger wrapper');
  // No directional Tailwind utilities (UX-DR33).
  assert.doesNotMatch(
    src,
    FORBID_DIRECTIONAL,
    'TopNav must use logical Tailwind directional classes only',
  );
});

test('Story 7.17 Button size variants meet the 44px touch-target floor', () => {
  const src = read(BUTTON);
  // 32px (h-8) and 40px (h-10) are below the WCAG 2.5.5 44px floor — the
  // pre-7.17 sizes. Story 7.17 must lift them to 44px+ minimums.
  assert.doesNotMatch(
    src,
    /\bh-8\b/,
    'Button must not use h-8 (32px) — fails WCAG 2.5.5 44px touch-target floor',
  );
  assert.doesNotMatch(
    src,
    /\bh-10\b/,
    'Button must not use h-10 (40px) — fails WCAG 2.5.5 44px touch-target floor',
  );
  // 44 / 48 / 56 px (h-11 / h-12 / h-14) are the acceptable mobile floors.
  assert.match(
    src,
    /\bh-11\b/,
    'Button sm size must use h-11 (44px) to meet WCAG 2.5.5',
  );
});

test('Story 7.17 tailwind.config.ts exposes a display-2 font-size token for 360px responsive heading drop', () => {
  const src = read(TAILWIND_CONFIG);
  assert.match(
    src,
    /["']display-2["']/,
    'tailwind.config.ts must define a display-2 font-size token (responsive drop from display-1)',
  );
});

test('Story 7.17 contribute + claim clients use logical directional classes only', () => {
  for (const path of [CONTRIBUTE_CLIENT, CLAIM_CLIENT]) {
    const src = read(path);
    assert.doesNotMatch(
      src,
      FORBID_DIRECTIONAL,
      `${path} must use logical Tailwind directional classes only (ms-/me-/ps-/pe-/start-/end-)`,
    );
  }
});
