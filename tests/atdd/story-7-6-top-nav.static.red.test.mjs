import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = 'apps/reference';
const topNavPath = `${appRoot}/components/TopNav.tsx`;
const clusterPillPath = `${appRoot}/components/nav/ClusterPill.tsx`;
const localeDropdownPath = `${appRoot}/components/nav/LocaleDropdown.tsx`;
const walletStatusPath = `${appRoot}/components/nav/WalletStatus.tsx`;
const localeLayoutPath = `${appRoot}/app/[locale]/layout.tsx`;

function read(p) {
  return readFileSync(p, 'utf8');
}

function assertExists(p) {
  assert.ok(existsSync(p), `${p} must exist`);
}

test('Story 7.6 TopNav.tsx exists and is a Server Component (no "use client")', () => {
  assertExists(topNavPath);
  const src = read(topNavPath);
  assert.doesNotMatch(
    src,
    /^["']use client["']/m,
    'TopNav.tsx must be a Server Component (no "use client")',
  );
});

test('Story 7.6 TopNav.tsx imports ClusterPill, LocaleDropdown, SkinToggle, WalletStatus', () => {
  const src = read(topNavPath);
  assert.match(src, /ClusterPill/, 'TopNav must import/render ClusterPill');
  assert.match(src, /LocaleDropdown/, 'TopNav must import/render LocaleDropdown');
  assert.match(src, /SkinToggle/, 'TopNav must import/render SkinToggle');
  assert.match(src, /WalletStatus/, 'TopNav must import/render WalletStatus');
});

test('Story 7.6 TopNav accepts a locale prop', () => {
  const src = read(topNavPath);
  assert.match(
    src,
    /locale\s*[:?]/,
    'TopNav must declare a locale prop in its signature',
  );
});

test('Story 7.6 ClusterPill exists, reads env, uses Badge, never conditionally hides', () => {
  assertExists(clusterPillPath);
  const src = read(clusterPillPath);
  assert.match(src, /from\s+["']@\/lib\/env["']/, 'ClusterPill must import from @/lib/env');
  assert.match(src, /NEXT_PUBLIC_CLUSTER/, 'ClusterPill must reference NEXT_PUBLIC_CLUSTER');
  assert.match(
    src,
    /from\s+["']@\/components\/ui\/badge["']/,
    'ClusterPill must import Badge from shadcn',
  );
  assert.doesNotMatch(
    src,
    /return\s+null\s*;/,
    'ClusterPill must always render — no `return null` allowed (UX-DR16)',
  );
});

test('Story 7.6 LocaleDropdown exists, "use client", uses DropdownMenu, lists all six locales', () => {
  assertExists(localeDropdownPath);
  const src = read(localeDropdownPath);
  assert.match(src, /^["']use client["']/m, 'LocaleDropdown must declare "use client"');
  assert.match(
    src,
    /from\s+["']@\/components\/ui\/dropdown-menu["']/,
    'LocaleDropdown must import DropdownMenu from shadcn',
  );
  for (const code of ['en', 'vi', 'ar', 'es', 'yo', 'ht-kreyol']) {
    assert.match(
      src,
      new RegExp(`["']${code}["']`),
      `LocaleDropdown must list locale code '${code}'`,
    );
  }
});

test('Story 7.6 LocaleDropdown lists native locale names', () => {
  const src = read(localeDropdownPath);
  // Confirm presence of native-script names; the exact rendering can vary
  // but at minimum each language should appear by its native form.
  assert.match(src, /English/, 'LocaleDropdown must list English');
  assert.match(src, /Tiếng Việt/, 'LocaleDropdown must list Tiếng Việt');
  assert.match(src, /العربية/, 'LocaleDropdown must list العربية');
  assert.match(src, /Español/, 'LocaleDropdown must list Español');
  assert.match(src, /Yorùbá/, 'LocaleDropdown must list Yorùbá');
  assert.match(src, /Kreyòl/, 'LocaleDropdown must list Kreyòl Ayisyen');
});

test('Story 7.6 WalletStatus exists, "use client", placeholder Connect button, marks Privy integration point for 7.9', () => {
  assertExists(walletStatusPath);
  const src = read(walletStatusPath);
  assert.match(src, /^["']use client["']/m, 'WalletStatus must declare "use client"');
  assert.match(
    src,
    /from\s+["']@\/components\/ui\/button["']/,
    'WalletStatus must import Button from shadcn',
  );
  assert.match(src, /Connect/, 'WalletStatus must render a "Connect" placeholder');
  assert.match(
    src,
    /7\.9/,
    'WalletStatus must include a code comment marking the Story 7.9 Privy integration point',
  );
});

test('Story 7.6 [locale]/layout.tsx renders <TopNav /> and awaits params (Next.js 16)', () => {
  assertExists(localeLayoutPath);
  const src = read(localeLayoutPath);
  assert.match(src, /TopNav/, 'layout must render TopNav');
  assert.match(
    src,
    /params:\s*Promise<\s*\{\s*locale:\s*string\s*\}\s*>/,
    'layout must type params as Promise<{ locale: string }>',
  );
  assert.match(
    src,
    /await\s+params/,
    'layout must await params before destructuring locale',
  );
});

test('Story 7.6 new top-nav files use logical (start/end) not directional Tailwind', () => {
  const files = [topNavPath, clusterPillPath, localeDropdownPath, walletStatusPath];
  for (const f of files) {
    if (!existsSync(f)) continue;
    const src = read(f);
    assert.doesNotMatch(
      src,
      /\b(ml-|mr-|pl-|pr-|left-|right-)[0-9]+/,
      `${f} must use logical (start-/end-/ps-/pe-) not directional Tailwind classes`,
    );
  }
});
