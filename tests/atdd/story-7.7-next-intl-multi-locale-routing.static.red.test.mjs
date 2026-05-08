import test from 'node:test';
import assert from 'node:assert/strict';
import {access, readFile} from 'node:fs/promises';

const repoRoot = new URL('../../', import.meta.url);

async function readRepoFile(path) {
  return readFile(new URL(path, repoRoot), 'utf8');
}

async function readJson(path) {
  return JSON.parse(await readRepoFile(path));
}

function collectKeys(value, prefix = '', out = new Set()) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      out.add(path);
      collectKeys(child, path, out);
    }
  }

  return out;
}

test('[P0] Story 7.7 locale bundles include en + vi + committed stubs with key parity', async () => {
  const expectedLocales = ['en', 'vi', 'ar', 'es', 'yo', 'ht-kreyol'];
  for (const locale of expectedLocales) {
    await access(new URL(`apps/reference/messages/${locale}.json`, repoRoot));
  }

  const en = await readJson('apps/reference/messages/en.json');
  const vi = await readJson('apps/reference/messages/vi.json');
  const enKeys = collectKeys(en);

  assert.ok(enKeys.has('localeSwitcher.label'));
  assert.ok(enKeys.has('localeSwitcher.options.ar'));
  assert.ok(enKeys.has('home.title'));
  assert.ok(enKeys.has('errors.GroupFull'));

  assert.deepEqual(
    [...collectKeys(vi)].sort(),
    [...enKeys].sort(),
    'vi.json must contain the full key parity surface from en.json',
  );

  for (const locale of ['ar', 'es', 'yo', 'ht-kreyol']) {
    const stub = await readJson(`apps/reference/messages/${locale}.json`);
    assert.deepEqual(stub, en, `${locale}.json must be an English fallback stub with all keys present`);
  }
});

test('[P0] Story 7.7 i18n routing config uses locale cookie persistence with default en', async () => {
  const config = await readRepoFile('apps/reference/lib/i18n/config.ts');

  assert.match(config, /locales\s*=\s*\['en',\s*'vi',\s*'ar',\s*'es',\s*'yo',\s*'ht-kreyol'\]/);
  assert.match(config, /defaultLocale[^\n]*'en'/);
  assert.match(config, /localeCookie\s*=\s*\{/);
  assert.match(config, /name:\s*'NEXT_LOCALE'/);
  assert.match(config, /localePrefix:\s*'always'/);
  assert.match(config, /rtlLocales\s*=\s*\['ar'\]/);
});

test('[P0] Story 7.7 middleware + UI cover locale switch, lang updates, and RTL behavior contracts', async () => {
  const middleware = await readRepoFile('apps/reference/middleware.ts');
  const layout = await readRepoFile('apps/reference/app/[locale]/layout.tsx');
  const dropdown = await readRepoFile('apps/reference/components/locale-dropdown.tsx');
  const playwright = await readRepoFile('apps/reference/tests/e2e/locale-switching.spec.ts');

  assert.match(middleware, /createMiddleware/);
  assert.match(middleware, /matcher/);

  assert.match(layout, /<html\s+dir=\{localeDirection\(locale\)\}\s+lang=\{locale\}>/);

  assert.match(dropdown, /useTranslation\(/);
  assert.match(dropdown, /router\.replace\(/);
  assert.match(dropdown, /onChange=/);

  assert.match(playwright, /selectOption\('vi'\)/);
  assert.match(playwright, /toHaveAttribute\('lang',\s*'vi'\)/);
  assert.match(playwright, /toHaveAttribute\('dir',\s*'rtl'\)/);
  assert.match(playwright, /not\.toBe\('reload'\)/);
});

test('[P1] Story 7.7 component JSX avoids hard-coded UI copy outside translation keys', async () => {
  const dropdown = await readRepoFile('apps/reference/components/locale-dropdown.tsx');
  const page = await readRepoFile('apps/reference/app/[locale]/page.tsx');

  assert.match(dropdown, /useTranslation\('localeSwitcher'\)/);
  assert.match(dropdown, /t\('label'\)/);
  assert.match(dropdown, /t\(`options\.\$\{item\}`\)/);

  assert.match(page, /getTranslations\('home'\)/);
  assert.match(page, /t\('title'\)/);
  assert.match(page, /t\('subtitle'\)/);
  assert.match(page, /t\('primaryCta'\)/);
  assert.match(page, /t\('secondaryCta'\)/);
});
