import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = 'apps/reference';
const fontsDir = `${appRoot}/public/fonts`;
const fontsTsPath = `${appRoot}/lib/theme/fonts.ts`;
const tokensCssPath = `${appRoot}/lib/theme/tokens.css`;
const numericCssPath = `${appRoot}/lib/theme/numeric.css`;
const tailwindConfigPath = `${appRoot}/tailwind.config.ts`;
const globalsCssPath = `${appRoot}/app/globals.css`;
const rootLayoutPath = `${appRoot}/app/layout.tsx`;

function read(p) {
  return readFileSync(p, 'utf8');
}

function assertExists(p) {
  assert.ok(existsSync(p), `${p} must exist`);
}

test('Story 7.3 self-hosts Geist + Inter + Geist Mono + Noto fallbacks under public/fonts', () => {
  assertExists(fontsDir);
  // Geist + Geist Mono variable woff2 (Vercel OFL/MIT) for display + mono.
  assertExists(`${fontsDir}/GeistVF.woff2`);
  assertExists(`${fontsDir}/GeistMonoVF.woff2`);
  // Inter variable woff2 (rsms OFL) for body.
  assertExists(`${fontsDir}/InterVF.woff2`);
  // Multilingual fallbacks per UX-DR9 (Yoruba via Noto Sans + Arabic).
  assertExists(`${fontsDir}/NotoSans-Regular.ttf`);
  assertExists(`${fontsDir}/NotoSansArabic-Regular.ttf`);
});

test('Story 7.3 lib/theme/fonts.ts exports next/font/local instances with locked CSS variables', () => {
  assertExists(fontsTsPath);
  const src = read(fontsTsPath);
  assert.match(src, /from\s+["']next\/font\/local["']/, 'must use next/font/local for self-hosted assets');
  // No google fonts import — runtime Google Fonts is forbidden by AC.
  assert.doesNotMatch(src, /from\s+["']next\/font\/google["']/, 'must NOT import next/font/google');
  // Each variable handle declared.
  assert.match(src, /--font-display/, 'must expose --font-display');
  assert.match(src, /--font-body/, 'must expose --font-body');
  assert.match(src, /--font-mono/, 'must expose --font-mono');
  assert.match(src, /--font-noto-arabic/, 'must expose --font-noto-arabic for RTL fallback');
  assert.match(src, /--font-noto-sans/, 'must expose --font-noto-sans for Yoruba/Latin-ext fallback');
  // Each font asset path referenced.
  assert.match(src, /GeistVF\.woff2/, 'must reference GeistVF.woff2');
  assert.match(src, /GeistMonoVF\.woff2/, 'must reference GeistMonoVF.woff2');
  assert.match(src, /InterVF\.woff2/, 'must reference InterVF.woff2');
  assert.match(src, /NotoSansArabic-Regular\.ttf/, 'must reference NotoSansArabic-Regular.ttf');
  assert.match(src, /NotoSans-Regular\.ttf/, 'must reference NotoSans-Regular.ttf');
  // Named exports for layout to consume.
  assert.match(src, /export\s+const\s+geistDisplay/, 'must export geistDisplay');
  assert.match(src, /export\s+const\s+inter/, 'must export inter');
  assert.match(src, /export\s+const\s+geistMono/, 'must export geistMono');
});

test('Story 7.3 root layout wires font CSS variables and avoids Google Fonts runtime', () => {
  const layout = read(rootLayoutPath);
  assert.doesNotMatch(layout, /next\/font\/google/, 'layout must not import next/font/google');
  assert.doesNotMatch(layout, /fonts\.googleapis\.com/, 'layout must not reference fonts.googleapis.com');
  assert.match(layout, /from\s+["']@\/lib\/theme\/fonts["']|from\s+["']\.\.?\/.*fonts["']/, 'layout must import the local fonts module');
  assert.match(layout, /geistDisplay\.variable/, 'layout must apply geistDisplay.variable');
  assert.match(layout, /inter\.variable/, 'layout must apply inter.variable');
  assert.match(layout, /geistMono\.variable/, 'layout must apply geistMono.variable');
  assert.match(layout, /notoArabic\.variable/, 'layout must apply notoArabic.variable');
  assert.match(layout, /notoSans\.variable/, 'layout must apply notoSans.variable');
});

test('Story 7.3 tokens.css defines the locked type scale per UX-DR10', () => {
  const css = read(tokensCssPath);
  for (const tok of ['--text-display-1', '--text-h1', '--text-h2', '--text-body', '--text-caption']) {
    assert.ok(css.includes(tok), `tokens.css must define ${tok}`);
  }
  // Display-1 spec: 56/64 per UX-DR10.
  assert.match(css, /--text-display-1[^;]*56px/, '--text-display-1 must encode 56px font-size');
  assert.match(css, /--text-display-1[^;]*64px/, '--text-display-1 must encode 64px line-height');
});

test('Story 7.3 ships a .numeric utility applying tnum + lnum feature settings', () => {
  assertExists(numericCssPath);
  const css = read(numericCssPath);
  assert.match(css, /\.numeric\b/, 'numeric.css must define a .numeric class');
  assert.match(css, /font-feature-settings\s*:[^;]*"tnum"/, '.numeric must enable tnum');
  assert.match(css, /font-feature-settings\s*:[^;]*"lnum"/, '.numeric must enable lnum');
  // Globals must import the numeric utility so it ships in the bundle.
  const globals = read(globalsCssPath);
  assert.match(globals, /numeric\.css/, 'app/globals.css must @import numeric.css');
});

test('Story 7.3 tailwind.config.ts wires display/sans/mono families and the type scale', () => {
  const cfg = read(tailwindConfigPath);
  assert.match(cfg, /display:\s*\[[^\]]*--font-display/, 'fontFamily.display must read --font-display');
  assert.match(cfg, /sans:\s*\[[^\]]*--font-body/, 'fontFamily.sans must read --font-body');
  assert.match(cfg, /mono:\s*\[[^\]]*--font-mono/, 'fontFamily.mono must read --font-mono');
  for (const size of ['display-1', 'h1', 'h2', 'body', 'caption']) {
    assert.ok(cfg.includes(size), `tailwind.config.ts must declare fontSize.${size}`);
  }
});

test('Story 7.3 globals.css @theme block stays in sync with the type tokens', () => {
  const globals = read(globalsCssPath);
  // Tailwind v4 @theme inline must surface the typography variables so utility
  // classes generated from the CSS-first pipeline match tailwind.config.ts.
  assert.match(globals, /--font-display/, '@theme must reference --font-display');
  assert.match(globals, /--font-body/, '@theme must reference --font-body');
});
