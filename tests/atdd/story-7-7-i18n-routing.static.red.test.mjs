import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = 'apps/reference';
const messagesDir = `${appRoot}/messages`;
const i18nConfigPath = `${appRoot}/lib/i18n/config.ts`;
const middlewarePath = `${appRoot}/middleware.ts`;
const localeLayoutPath = `${appRoot}/app/[locale]/layout.tsx`;
const localePagePath = `${appRoot}/app/[locale]/page.tsx`;
const intlWrapperPath = `${appRoot}/app/providers/IntlProviderWrapper.tsx`;

const LIVE_LOCALES = ['en', 'vi'];
const STUB_LOCALES = ['ar', 'es', 'yo', 'ht-kreyol'];
const ALL_LOCALES = [...LIVE_LOCALES, ...STUB_LOCALES];

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertExists(path) {
  assert.ok(existsSync(path), `${path} must exist`);
}

function collectKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

test('Story 7.7 ships all six locale message files', () => {
  for (const locale of ALL_LOCALES) {
    const path = `${messagesDir}/${locale}.json`;
    assertExists(path);
    const parsed = JSON.parse(read(path));
    assert.equal(typeof parsed, 'object', `${path} must parse to a JSON object`);
    assert.ok(parsed !== null, `${path} must not be null`);
  }
});

test('Story 7.7 vi.json is a real translation, not a copy of en.json', () => {
  const en = JSON.parse(read(`${messagesDir}/en.json`));
  const vi = JSON.parse(read(`${messagesDir}/vi.json`));

  const enKeys = collectKeys(en).sort();
  const viKeys = collectKeys(vi).sort();
  assert.deepEqual(viKeys, enKeys, 'vi.json must carry the same key set as en.json');

  // At least one leaf value must differ from English to demonstrate real translation.
  const enValues = JSON.stringify(en);
  const viValues = JSON.stringify(vi);
  assert.notEqual(viValues, enValues, 'vi.json must contain actual Vietnamese translations, not a copy of en.json');
});

test('Story 7.7 stub locales (ar, es, yo, ht-kreyol) contain the full English key set', () => {
  const en = JSON.parse(read(`${messagesDir}/en.json`));
  const enKeys = collectKeys(en).sort();
  for (const locale of STUB_LOCALES) {
    const stub = JSON.parse(read(`${messagesDir}/${locale}.json`));
    const stubKeys = collectKeys(stub).sort();
    assert.deepEqual(stubKeys, enKeys, `${locale}.json must contain the full English key set (English fallback values per UX-DR47)`);
  }
});

test('Story 7.7 lib/i18n/config.ts exports locales, defaultLocale, and cookie persistence', () => {
  assertExists(i18nConfigPath);
  const src = read(i18nConfigPath);

  for (const locale of ALL_LOCALES) {
    assert.match(src, new RegExp(`["']${locale.replace('-', '\\-')}["']`), `i18n config must list locale ${locale}`);
  }

  assert.match(src, /export\s+const\s+locales\b/, 'i18n config must export `locales`');
  assert.match(src, /export\s+const\s+defaultLocale\s*=\s*["']en["']/, 'i18n config must export defaultLocale = "en"');
  assert.match(src, /cookie/i, 'i18n config must reference cookie-based locale persistence');
});

test('Story 7.7 middleware.ts wires next-intl middleware with the configured locales', () => {
  assertExists(middlewarePath);
  const src = read(middlewarePath);
  assert.match(src, /from\s+["']next-intl\/middleware["']/, 'middleware.ts must import from next-intl/middleware');
  assert.match(src, /locales/, 'middleware.ts must reference `locales`');
  assert.match(src, /defaultLocale/, 'middleware.ts must reference `defaultLocale`');
  assert.match(src, /export\s+const\s+config\b/, 'middleware.ts must export a `config` matcher');
});

test('Story 7.7 moves segments under app/[locale]/ with locale-aware <html>', () => {
  assertExists(localeLayoutPath);
  assertExists(localePagePath);

  const layout = read(localeLayoutPath);
  assert.match(layout, /params/, 'app/[locale]/layout.tsx must accept `params`');
  assert.match(layout, /locale/, 'app/[locale]/layout.tsx must read locale from params');
  assert.match(layout, /lang=\{[^}]*locale[^}]*\}/, 'app/[locale]/layout.tsx must set <html lang={locale}>');
  assert.match(layout, /dir=/, 'app/[locale]/layout.tsx must set <html dir=...> for RTL handling');
  assert.match(layout, /ar/, 'app/[locale]/layout.tsx must reference the RTL locale ("ar")');
});

test('Story 7.7 IntlProviderWrapper loads messages by locale instead of hardcoding en', () => {
  assertExists(intlWrapperPath);
  const src = read(intlWrapperPath);
  assert.match(src, /^["']use client["']/m, 'IntlProviderWrapper must be a client component');
  assert.match(src, /messages/, 'IntlProviderWrapper must accept messages');
  assert.match(src, /locale/, 'IntlProviderWrapper must accept locale');
  // The 7.1 stub hardcoded {"app.title": ...}; that line must be gone.
  assert.doesNotMatch(src, /"app\.title":\s*"Susu Reference App"/, 'IntlProviderWrapper must no longer hardcode the 7.1 stub messages map');
});
