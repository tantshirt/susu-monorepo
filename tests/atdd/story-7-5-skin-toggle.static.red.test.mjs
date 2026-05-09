import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = 'apps/reference';
const togglePath = `${appRoot}/components/SkinToggle.tsx`;
const skinHelperPath = `${appRoot}/lib/theme/skin.ts`;
const rootLayoutPath = `${appRoot}/app/layout.tsx`;

function read(p) {
  return readFileSync(p, 'utf8');
}

function assertExists(p) {
  assert.ok(existsSync(p), `${p} must exist`);
}

test('Story 7.5 SkinToggle Client Component file exists', () => {
  assertExists(togglePath);
});

test('Story 7.5 SkinToggle declares "use client" and references both skin names', () => {
  const src = read(togglePath);
  assert.match(src, /^["']use client["']/m, 'SkinToggle.tsx must declare the "use client" directive');
  assert.match(src, /\bneutral\b/, 'SkinToggle.tsx must reference the "neutral" skin');
  assert.match(src, /\bdiaspora\b/, 'SkinToggle.tsx must reference the "diaspora" skin');
  assert.match(src, /data-skin|dataset\.skin/, 'SkinToggle.tsx must read or write the data-skin attribute');
});

test('Story 7.5 SkinToggle persists state via both localStorage and document.cookie with the susu-skin key', () => {
  const src = read(togglePath);
  assert.match(src, /localStorage/, 'SkinToggle.tsx must read/write localStorage');
  assert.match(src, /document\.cookie/, 'SkinToggle.tsx must write document.cookie');
  assert.match(src, /susu-skin/, 'SkinToggle.tsx must use the "susu-skin" storage key');
});

test('Story 7.5 SkinToggle cookie carries Path=/, Max-Age=31536000, SameSite=Lax (SSR-readable)', () => {
  const src = read(togglePath);
  assert.match(src, /Path=\//, 'cookie must include Path=/');
  assert.match(src, /Max-Age=31536000/, 'cookie must include Max-Age=31536000 (1 year)');
  assert.match(src, /SameSite=Lax/, 'cookie must include SameSite=Lax');
});

test('Story 7.5 SkinToggle uses the shadcn Button primitive from Story 7.4', () => {
  const src = read(togglePath);
  assert.match(
    src,
    /from\s+["']@\/components\/ui\/button["']/,
    'SkinToggle.tsx must import Button from @/components/ui/button',
  );
});

test('Story 7.5 lib/theme/skin.ts exports getServerSkin reading next/headers cookies()', () => {
  assertExists(skinHelperPath);
  const src = read(skinHelperPath);
  assert.match(src, /from\s+["']next\/headers["']/, 'skin.ts must import from next/headers');
  assert.match(src, /\bcookies\b/, 'skin.ts must call cookies()');
  assert.match(
    src,
    /export\s+(?:async\s+)?function\s+getServerSkin\b|export\s+const\s+getServerSkin\b/,
    'skin.ts must export getServerSkin',
  );
  assert.match(src, /susu-skin/, 'skin.ts must read the "susu-skin" cookie');
});

test('Story 7.5 root layout reads getServerSkin and renders <html data-skin={...}> for SSR hydration', () => {
  const src = read(rootLayoutPath);
  assert.match(src, /getServerSkin/, 'app/layout.tsx must import/call getServerSkin');
  assert.match(src, /data-skin=\{/, 'app/layout.tsx must interpolate data-skin from the server skin');
});

test('Story 7.5 root layout includes a pre-hydration inline script that reconciles localStorage with data-skin (no FOUC)', () => {
  const src = read(rootLayoutPath);
  assert.match(
    src,
    /dangerouslySetInnerHTML/,
    'app/layout.tsx must inject a pre-hydration script via dangerouslySetInnerHTML',
  );
  assert.match(src, /localStorage/, 'pre-hydration script must read localStorage');
  assert.match(src, /susu-skin/, 'pre-hydration script must reference the "susu-skin" key');
});
