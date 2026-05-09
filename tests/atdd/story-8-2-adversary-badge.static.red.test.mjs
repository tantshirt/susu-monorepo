import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * Story 8.2 — static red harness for `<AdversaryBadge />`.
 *
 * Asserts the route handler + pure renderer + types + node:test unit tests
 * are wired up against `audits/adversary/adversary-report.json`.
 */

const routePath = 'apps/reference/app/api/badge/adversary/route.ts';
const libPath = 'apps/reference/lib/badge/adversary.ts';
const typesPath = 'apps/reference/lib/badge/types.ts';
const unitTestPath = 'apps/reference/app/api/badge/adversary/route.test.ts';
const reportPath = 'audits/adversary/adversary-report.json';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('Story 8.2 ships a Next.js Route Handler reading the committed adversary report', () => {
  for (const path of [routePath, libPath, typesPath, unitTestPath, reportPath]) {
    assert.ok(existsSync(path), `${path} must exist`);
  }

  const route = read(routePath);
  assert.match(route, /export\s+(?:async\s+)?function\s+GET\b/, 'route must export an async GET handler');
  assert.match(route, /audits\/adversary\/adversary-report\.json/, 'route must reference the committed adversary report');
  assert.match(route, /readFileSync|readFile\b/, 'route must read the committed report via fs (not fetch)');
  assert.doesNotMatch(route, /\bfetch\(/, 'route must not fetch the report over the network');
  assert.match(route, /image\/svg\+xml/, 'route must return SVG content-type');
  assert.match(route, /Cache-Control/i, 'route must set Cache-Control for ISR');
  assert.match(route, /s-maxage=/i, 'route must set an s-maxage value (Vercel ISR pattern)');
  assert.match(route, /from ['"](?:@\/lib\/badge\/adversary|\.\.\/\.\.\/\.\.\/\.\.\/lib\/badge\/adversary|\.\.\/\.\.\/\.\.\/lib\/badge\/adversary)['"]/, 'route must import the renderer from lib/badge/adversary');
});

test('Story 8.2 lib renders three states with protocol-locked colors', () => {
  const lib = read(libPath);
  assert.match(lib, /export\s+function\s+renderAdversarySvg\b/, 'lib must export renderAdversarySvg');
  assert.match(lib, /['"]verified['"]/, 'lib must handle verified state');
  assert.match(lib, /['"]pending['"]/, 'lib must handle pending state');
  assert.match(lib, /['"]failed['"]/, 'lib must handle failed state');
  assert.match(lib, /10,?000 adversarial circles passed/i, 'verified label must read "10,000 adversarial circles passed"');
  assert.match(lib, /Pending verification/i, 'pending label must read "Pending verification"');
  assert.match(lib, /FAILED\s*[—-]\s*view report/i, 'failed label must read "FAILED — view report"');
  assert.match(lib, /#14F195/i, 'verified state must use the Solana mint color');
  assert.match(lib, /#FBBF24/i, 'pending state must use the warn (amber) color');
  assert.match(lib, /#F87171/i, 'failed state must use the danger (coral) color');
  assert.match(lib, /<svg[\s\S]*xmlns=["']http:\/\/www\.w3\.org\/2000\/svg["']/, 'renderer must emit a valid SVG namespace');
});

test('Story 8.2 types describe the adversary report shape consumed by the badge', () => {
  const types = read(typesPath);
  assert.match(types, /AdversaryReport\b/, 'types module must export AdversaryReport');
  assert.match(types, /run_metadata\b/, 'types must reference run_metadata');
  assert.match(types, /commit_sha\b/, 'types must include commit_sha');
  assert.match(types, /max_defector_profit_lamports\b/, 'types must include max_defector_profit_lamports');
});

test('Story 8.2 unit tests cover all three badge states via fs.readFileSync mocks', () => {
  const unit = read(unitTestPath);
  assert.match(unit, /node:test/, 'unit tests must use node:test');
  assert.match(unit, /readFileSync/, 'unit tests must mock readFileSync');
  assert.match(unit, /verified/, 'unit tests must cover verified state');
  assert.match(unit, /pending/, 'unit tests must cover pending state');
  assert.match(unit, /failed/, 'unit tests must cover failed state');
  assert.match(unit, /image\/svg\+xml/, 'unit tests must assert SVG content-type');
});

test('Story 8.2 adversary report ships the fields the badge depends on', () => {
  const report = JSON.parse(read(reportPath));
  assert.ok(report.run_metadata, 'report must have run_metadata');
  assert.ok(typeof report.run_metadata.commit_sha === 'string', 'report must record commit_sha');
  assert.ok(report.summary, 'report must have summary');
  assert.equal(typeof report.summary.max_defector_profit_lamports, 'number', 'summary.max_defector_profit_lamports must be numeric');
});
