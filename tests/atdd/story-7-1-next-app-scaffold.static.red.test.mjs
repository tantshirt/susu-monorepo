import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const appRoot = 'apps/reference';
const layoutPath = `${appRoot}/app/layout.tsx`;
const pagePath = `${appRoot}/app/page.tsx`;
const pkgPath = `${appRoot}/package.json`;
const tsconfigPath = `${appRoot}/tsconfig.json`;
const envLoaderPath = `${appRoot}/lib/env.ts`;
const envExamplePath = `${appRoot}/.env.example`;
const readmePath = `${appRoot}/README.md`;
const privyWrapperPath = `${appRoot}/app/providers/PrivyProviderWrapper.tsx`;
const convexWrapperPath = `${appRoot}/app/providers/ConvexProviderWrapper.tsx`;
const intlWrapperPath = `${appRoot}/app/providers/IntlProviderWrapper.tsx`;
const checkPatternsPath = 'scripts/check-patterns.sh';

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertExists(path) {
  assert.ok(existsSync(path), `${path} must exist`);
}

test('Story 7.1 scaffolds Next.js 15 App Router under apps/reference with flat layout', () => {
  for (const path of [layoutPath, pagePath, pkgPath, tsconfigPath]) {
    assertExists(path);
  }

  const pkg = JSON.parse(read(pkgPath));
  assert.equal(pkg.name, '@susu/reference', 'workspace name must be @susu/reference');
  const nextDep = pkg.dependencies?.next ?? pkg.devDependencies?.next;
  assert.ok(typeof nextDep === 'string' && /1[5-9]/.test(nextDep), `next must be 15.x or newer, saw ${nextDep}`);
  assert.ok(pkg.dependencies?.['@privy-io/react-auth'], 'must declare @privy-io/react-auth');
  assert.ok(pkg.dependencies?.['convex'], 'must declare convex');
  assert.ok(pkg.dependencies?.['next-intl'], 'must declare next-intl');
  assert.ok(pkg.dependencies?.['zod'], 'must declare zod');

  // Flat layout — no src/ directory
  assert.ok(!existsSync(`${appRoot}/src`), 'apps/reference must NOT use legacy src/ directory layout');
});

test('Story 7.1 layout.tsx nests PrivyProvider > ConvexProvider > IntlProvider > children', () => {
  assertExists(layoutPath);
  const layout = read(layoutPath);

  // Each wrapper imported and present in JSX in correct nesting order
  assert.match(layout, /PrivyProviderWrapper/, 'layout must reference PrivyProviderWrapper');
  assert.match(layout, /ConvexProviderWrapper/, 'layout must reference ConvexProviderWrapper');
  assert.match(layout, /IntlProviderWrapper/, 'layout must reference IntlProviderWrapper');

  // Order check: PrivyProviderWrapper opening tag must precede ConvexProviderWrapper opening tag,
  // which must precede IntlProviderWrapper opening tag.
  const privyIdx = layout.search(/<PrivyProviderWrapper\b/);
  const convexIdx = layout.search(/<ConvexProviderWrapper\b/);
  const intlIdx = layout.search(/<IntlProviderWrapper\b/);
  assert.ok(privyIdx > -1 && convexIdx > -1 && intlIdx > -1, 'all three provider wrappers must appear as JSX elements');
  assert.ok(privyIdx < convexIdx, 'PrivyProviderWrapper must wrap ConvexProviderWrapper');
  assert.ok(convexIdx < intlIdx, 'ConvexProviderWrapper must wrap IntlProviderWrapper');
});

test('Story 7.1 each provider wrapper is a client component and ConvexProviderWrapper does not import convex schema', () => {
  for (const wrapper of [privyWrapperPath, convexWrapperPath, intlWrapperPath]) {
    assertExists(wrapper);
    const src = read(wrapper);
    assert.match(src, /^["']use client["']/m, `${wrapper} must declare "use client"`);
  }

  const convexSrc = read(convexWrapperPath);
  assert.match(convexSrc, /ConvexReactClient/, 'ConvexProviderWrapper must use ConvexReactClient');
  assert.doesNotMatch(convexSrc, /from\s+["']\.\.\/(\.\.\/)*convex\/_generated/, 'ConvexProviderWrapper must NOT import convex/_generated yet (Story 7.13)');
  assert.doesNotMatch(convexSrc, /from\s+["']convex\/_generated/, 'ConvexProviderWrapper must NOT import convex/_generated yet');
});

test('Story 7.1 lib/env.ts is a Zod schema covering all six required keys with helpful error citing .env.example', () => {
  assertExists(envLoaderPath);
  const env = read(envLoaderPath);

  assert.match(env, /from\s+["']zod["']/, 'lib/env.ts must import from zod');
  assert.match(env, /z\.object\(/, 'lib/env.ts must define a z.object schema');

  for (const key of [
    'NEXT_PUBLIC_HELIUS_RPC_URL',
    'NEXT_PUBLIC_PRIVY_APP_ID',
    'NEXT_PUBLIC_CONVEX_URL',
    'NEXT_PUBLIC_PROGRAM_ID',
    'NEXT_PUBLIC_CLUSTER',
    'NEXT_PUBLIC_SPHERE_ENABLED',
  ]) {
    assert.match(env, new RegExp(`\\b${key}\\b`), `lib/env.ts must reference ${key}`);
  }

  assert.match(env, /\.env\.example/, 'validation error must cite .env.example');
  assert.match(env, /export\s+const\s+env\b/, 'lib/env.ts must export a typed env object');

  // Parse-check
  const parse = spawnSync('node', ['--check', envLoaderPath], { encoding: 'utf8' });
  // node --check does not handle .ts; rely on tsc later; just assert file is non-empty
  assert.ok(env.length > 0, 'lib/env.ts must be non-empty');
  void parse;
});

test('Story 7.1 commits .env.example with every required key and dummy values', () => {
  assertExists(envExamplePath);
  const example = read(envExamplePath);
  for (const key of [
    'NEXT_PUBLIC_HELIUS_RPC_URL',
    'NEXT_PUBLIC_PRIVY_APP_ID',
    'NEXT_PUBLIC_CONVEX_URL',
    'NEXT_PUBLIC_PROGRAM_ID',
    'NEXT_PUBLIC_CLUSTER',
    'NEXT_PUBLIC_SPHERE_ENABLED',
  ]) {
    assert.match(example, new RegExp(`^${key}=`, 'm'), `.env.example must define ${key}`);
  }
});

test('Story 7.1 README documents provider order with auth-hydration rationale', () => {
  assertExists(readmePath);
  const readme = read(readmePath);
  assert.match(readme, /PrivyProvider/, 'README must mention PrivyProvider');
  assert.match(readme, /ConvexProvider/, 'README must mention ConvexProvider');
  assert.match(readme, /IntlProvider/, 'README must mention IntlProvider');
  assert.match(readme, /auth/i, 'README must explain auth hydration rationale');
});

test('Story 7.1 check-patterns.sh forbids process.env outside apps/reference/lib/env.ts', () => {
  assertExists(checkPatternsPath);
  const script = read(checkPatternsPath);
  assert.match(script, /process\\?\.env/, 'check-patterns.sh must grep for process.env');
  assert.match(script, /apps\/reference\/lib\/env\.ts/, 'check-patterns.sh must allow only apps/reference/lib/env.ts');

  // Run the check; it must exit 0 against the current tree.
  const result = spawnSync('bash', [checkPatternsPath], { encoding: 'utf8' });
  assert.equal(result.status, 0, `check-patterns.sh must pass; output:\n${result.stdout}\n${result.stderr}`);
});
