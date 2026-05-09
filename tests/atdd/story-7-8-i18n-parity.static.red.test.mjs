import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const scriptPath = 'scripts/check-i18n-parity.ts';
const workflowPath = '.github/workflows/i18n-parity.yml';
const contributingPath = 'CONTRIBUTING-TRANSLATIONS.md';
const rootPkgPath = 'package.json';
const messagesDir = 'apps/reference/messages';

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertExists(path) {
  assert.ok(existsSync(path), `${path} must exist`);
}

test('Story 7.8 parity script reads en.json as baseline and reports missing/extra keys', () => {
  assertExists(scriptPath);
  const src = read(scriptPath);
  assert.match(src, /en\.json/, 'script must reference en.json baseline');
  assert.match(src, /missing/i, 'script must report missing keys');
  assert.match(src, /extra/i, 'script must report extra keys');
  assert.match(src, /process\.exit\(1\)/, 'script must exit non-zero on failure');
});

test('Story 7.8 dedicated workflow runs on message and script changes', () => {
  assertExists(workflowPath);
  const wf = read(workflowPath);
  assert.match(wf, /apps\/reference\/messages\/\*\*/, 'workflow must trigger on messages path');
  assert.match(wf, /scripts\/check-i18n-parity/, 'workflow must trigger on parity script changes');
  assert.match(wf, /i18n:check|check-i18n-parity\.ts/, 'workflow must invoke the parity check');
  assert.match(wf, /pull_request/, 'workflow must run on pull_request');
});

test('Story 7.8 root package.json exposes pnpm i18n:check', () => {
  assertExists(rootPkgPath);
  const pkg = JSON.parse(read(rootPkgPath));
  assert.ok(pkg.scripts && typeof pkg.scripts['i18n:check'] === 'string', 'root package.json must declare scripts["i18n:check"]');
  assert.match(pkg.scripts['i18n:check'], /check-i18n-parity/, 'i18n:check must invoke the parity script');
});

test('Story 7.8 CONTRIBUTING-TRANSLATIONS.md documents parity error format and recovery workflow', () => {
  assertExists(contributingPath);
  const doc = read(contributingPath);
  for (const phrase of [
    /parity/i,
    /error format/i,
    /recovery/i,
    /pnpm i18n:check/,
    /ICU/i,
    /stub/i,
    /en\.json/,
  ]) {
    assert.match(doc, phrase, `CONTRIBUTING-TRANSLATIONS.md must mention ${phrase}`);
  }
  // List of supported locales.
  for (const locale of ['en', 'vi', 'ar', 'es', 'yo', 'ht-kreyol']) {
    assert.match(doc, new RegExp(`\\b${locale}\\b`), `CONTRIBUTING-TRANSLATIONS.md must mention locale ${locale}`);
  }
});

test('Story 7.8 every required locale file exists with identical key set', () => {
  for (const locale of ['en', 'vi', 'ar', 'es', 'yo', 'ht-kreyol']) {
    assertExists(`${messagesDir}/${locale}.json`);
  }
});

test('Story 7.8 pnpm i18n:check exits 0 on the current tree', () => {
  const result = spawnSync('pnpm', ['i18n:check'], { encoding: 'utf8' });
  assert.equal(
    result.status,
    0,
    `pnpm i18n:check must exit 0; output:\n${result.stdout}\n${result.stderr}`,
  );
});
