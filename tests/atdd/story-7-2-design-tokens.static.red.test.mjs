import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = 'apps/reference';
const tokensPath = `${appRoot}/lib/theme/tokens.css`;
const diasporaPath = `${appRoot}/lib/theme/skin-diaspora.css`;
const tailwindConfigPath = `${appRoot}/tailwind.config.ts`;
const globalsPath = `${appRoot}/app/globals.css`;

const NEUTRAL_TOKENS = [
  '--bg',
  '--surface',
  '--surface-2',
  '--border',
  '--text',
  '--text-muted',
  '--primary',
  '--secondary',
  '--signal',
  '--warn',
  '--danger',
  '--shadow-1',
  '--shadow-2',
];

const DIASPORA_OVERRIDES = [
  '--surface',
  '--surface-2',
  '--border',
  '--text',
  '--text-muted',
  '--primary',
  '--secondary',
  '--shadow-1',
  '--shadow-2',
];

// Cross-skin invariants per UX-DR2.
const DIASPORA_FORBIDDEN = ['--bg', '--signal', '--warn', '--danger'];

const SEMANTIC_COLORS = [
  'bg',
  'surface',
  'surface2',
  'border',
  'text',
  'muted',
  'primary',
  'secondary',
  'signal',
  'warn',
  'danger',
];

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertExists(path) {
  assert.ok(existsSync(path), `${path} must exist`);
}

test('Story 7.2 lib/theme/tokens.css defines neutral skin with every UX-DR3 token', () => {
  assertExists(tokensPath);
  const tokens = read(tokensPath);

  assert.match(
    tokens,
    /:root\[data-skin\s*=\s*["']neutral["']\]/,
    'tokens.css must define :root[data-skin="neutral"] block',
  );

  for (const token of NEUTRAL_TOKENS) {
    // Use a regex escape for the leading dashes.
    const escaped = token.replace(/-/g, '\\-');
    assert.match(
      tokens,
      new RegExp(`${escaped}\\s*:`),
      `tokens.css neutral skin must define ${token}`,
    );
  }
});

test('Story 7.2 neutral primary is Solana mint, not purple', () => {
  const tokens = read(tokensPath);
  // Match the --primary line in the neutral block.
  // Mint green canonical RGB component pattern: green channel dominates.
  // Locked Solana mint value used by Susu UX direction: 20 241 149 (#14F195).
  const mintLine = /--primary\s*:\s*20\s+241\s+149/;
  assert.match(
    tokens,
    mintLine,
    '--primary in neutral skin must be Solana mint (20 241 149) per UX direction',
  );
});

test('Story 7.2 lib/theme/skin-diaspora.css overrides correct tokens and preserves invariants', () => {
  assertExists(diasporaPath);
  const diaspora = read(diasporaPath);

  assert.match(
    diaspora,
    /:root\[data-skin\s*=\s*["']diaspora["']\]/,
    'skin-diaspora.css must define :root[data-skin="diaspora"] block',
  );

  for (const token of DIASPORA_OVERRIDES) {
    const escaped = token.replace(/-/g, '\\-');
    assert.match(
      diaspora,
      new RegExp(`${escaped}\\s*:`),
      `skin-diaspora.css must override ${token}`,
    );
  }

  // Cross-skin invariants per UX-DR2.
  for (const token of DIASPORA_FORBIDDEN) {
    const escaped = token.replace(/-/g, '\\-');
    assert.doesNotMatch(
      diaspora,
      new RegExp(`${escaped}\\s*:`),
      `skin-diaspora.css must NOT redefine ${token} (cross-skin invariant per UX-DR2)`,
    );
  }
});

test('Story 7.2 tailwind.config.ts maps semantic colors to rgb(var(--token) / <alpha-value>)', () => {
  assertExists(tailwindConfigPath);
  const cfg = read(tailwindConfigPath);

  for (const name of SEMANTIC_COLORS) {
    assert.match(
      cfg,
      new RegExp(`\\b${name}\\b`),
      `tailwind.config.ts must define color key '${name}'`,
    );
  }

  // Each color key must map through rgb(var(--*) / <alpha-value>) for alpha support.
  assert.match(
    cfg,
    /rgb\(var\(--bg\)\s*\/\s*<alpha-value>\)/,
    'tailwind.config.ts must map --bg through rgb(var(--bg) / <alpha-value>)',
  );
  assert.match(
    cfg,
    /rgb\(var\(--primary\)\s*\/\s*<alpha-value>\)/,
    'tailwind.config.ts must map --primary through rgb(var(--primary) / <alpha-value>)',
  );
  assert.match(
    cfg,
    /rgb\(var\(--signal\)\s*\/\s*<alpha-value>\)/,
    'tailwind.config.ts must map --signal through rgb(var(--signal) / <alpha-value>)',
  );
});

test('Story 7.2 tailwind.config.ts encodes 4px spacing scale, radius scale, and Phantom shadows', () => {
  const cfg = read(tailwindConfigPath);

  // Spacing 4px base scale (UX-DR6) — at minimum confirm a spacing block exists with 4px-based values.
  assert.match(cfg, /spacing\s*:/, 'tailwind.config.ts must declare a spacing scale');
  assert.match(
    cfg,
    /['"]1['"]\s*:\s*['"]4px['"]/,
    'spacing scale must declare a 4px base unit (key "1" = "4px")',
  );

  // Radius scale (UX-DR7).
  assert.match(cfg, /borderRadius\s*:/, 'tailwind.config.ts must declare a borderRadius scale');
  assert.match(cfg, /['"]sm['"]\s*:\s*['"]6px['"]/, 'borderRadius.sm must be 6px (UX-DR7)');
  assert.match(cfg, /['"]md['"]\s*:\s*['"]10px['"]/, 'borderRadius.md must be 10px (UX-DR7)');

  // Phantom-style shadows (UX-DR8).
  assert.match(cfg, /boxShadow\s*:/, 'tailwind.config.ts must declare a boxShadow scale');
  assert.match(
    cfg,
    /var\(--shadow-1\)/,
    'boxShadow scale must reference --shadow-1 (Phantom-style shadow per UX-DR8)',
  );
  assert.match(
    cfg,
    /var\(--shadow-2\)/,
    'boxShadow scale must reference --shadow-2 (Phantom-style shadow per UX-DR8)',
  );
});

test('Story 7.2 globals.css imports tokens.css and skin-diaspora.css', () => {
  assertExists(globalsPath);
  const globals = read(globalsPath);

  assert.match(
    globals,
    /@import\s+["'][^"']*tokens\.css["']/,
    'globals.css must @import tokens.css',
  );
  assert.match(
    globals,
    /@import\s+["'][^"']*skin-diaspora\.css["']/,
    'globals.css must @import skin-diaspora.css',
  );
});

test('Story 7.2 default html has data-skin set so tokens take effect on first paint', () => {
  const layoutPath = `${appRoot}/app/layout.tsx`;
  assertExists(layoutPath);
  const layout = read(layoutPath);
  // Story 7.5 made `data-skin` SSR-aware via `getServerSkin()` (defaults
  // to "neutral" when no cookie). Either the literal default or the
  // dynamic interpolation satisfies the "tokens on first paint" intent.
  const literalDefault = /data-skin\s*=\s*["']neutral["']/.test(layout);
  const ssrAwareDefault =
    /data-skin\s*=\s*\{/.test(layout) && /getServerSkin/.test(layout);
  assert.ok(
    literalDefault || ssrAwareDefault,
    'layout.tsx <html> must set data-skin (literal "neutral" or dynamic via getServerSkin)',
  );
});
