import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * Story 8.3 — static red harness for `<UpgradeBurnedBadge />`.
 *
 * Asserts the route handler + pure renderer + node:test unit tests are
 * wired up against the mainnet upgrade-authority signal fetched via
 * `@solana/kit` RPC (NOT `solana program show` / `child_process`).
 */

const routePath = 'apps/reference/app/api/badge/upgrade-burned/route.ts';
const libPath = 'apps/reference/lib/badge/upgrade-burned.ts';
const unitTestPath = 'apps/reference/app/api/badge/upgrade-burned/route.test.ts';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('Story 8.3 ships a Next.js Route Handler driven by @solana/kit RPC', () => {
  for (const path of [routePath, libPath, unitTestPath]) {
    assert.ok(existsSync(path), `${path} must exist`);
  }

  const route = read(routePath);
  assert.match(route, /export\s+(?:async\s+)?function\s+GET\b/, 'route must export an async GET handler');
  assert.match(route, /@solana\/kit/, 'route must import from @solana/kit');
  assert.match(route, /createSolanaRpc/, 'route must use createSolanaRpc from @solana/kit');
  assert.doesNotMatch(route, /child_process/, 'route must NOT shell out (no child_process)');
  assert.doesNotMatch(route, /execSync|execFile|spawn\(/, 'route must NOT shell out to solana program show');
  assert.match(route, /image\/svg\+xml/, 'route must return SVG content-type');
  assert.match(route, /Cache-Control/i, 'route must set Cache-Control for ISR');
  assert.match(route, /s-maxage=600/i, 'route must set s-maxage=600 to match Story 8.2 ISR window');
  assert.match(route, /dynamic\s*=\s*['"]force-static['"]/, 'route must pin dynamic = force-static');
  assert.match(route, /revalidate\s*=\s*600/, 'route must pin revalidate = 600');
  assert.match(route, /1nc1nerator11111111111111111111111111111111/, 'route must reference the System Program incinerator address');
  assert.match(
    route,
    /from ['"](?:@\/lib\/badge\/upgrade-burned|\.\.\/\.\.\/\.\.\/\.\.\/lib\/badge\/upgrade-burned)['"]/,
    'route must import the renderer from lib/badge/upgrade-burned',
  );
});

test('Story 8.3 lib renders three states with protocol-locked colors', () => {
  const lib = read(libPath);
  assert.match(lib, /export\s+function\s+renderUpgradeBurnedSvg\b/, 'lib must export renderUpgradeBurnedSvg');
  assert.match(lib, /['"]verified['"]/, 'lib must handle verified state');
  assert.match(lib, /['"]pending['"]/, 'lib must handle pending state');
  assert.match(lib, /['"]warn['"]/, 'lib must handle warn state');
  assert.match(lib, /Upgrade authority:\s*burned/i, 'verified label must read "Upgrade authority: burned ✓"');
  assert.match(lib, /Mainnet pending audit/i, 'pending label must read "Mainnet pending audit"');
  assert.match(lib, /Upgrade:/i, 'warn label must read "Upgrade: <authority>"');
  assert.match(lib, /#14F195/i, 'verified state must use the Solana mint color');
  assert.match(lib, /#FBBF24/i, 'warn state must use the warn (amber) color');
  assert.match(lib, /<svg[\s\S]*xmlns=["']http:\/\/www\.w3\.org\/2000\/svg["']/, 'renderer must emit a valid SVG namespace');
});

test('Story 8.3 unit tests cover all three badge states via mocked RPC', () => {
  const unit = read(unitTestPath);
  assert.match(unit, /node:test/, 'unit tests must use node:test');
  assert.match(unit, /verified/, 'unit tests must cover verified (burned) state');
  assert.match(unit, /pending/, 'unit tests must cover pending (no deploy / RPC down) state');
  assert.match(unit, /warn/, 'unit tests must cover warn (deployed-but-not-burned) state');
  assert.match(unit, /image\/svg\+xml/, 'unit tests must assert SVG content-type');
  assert.match(unit, /1nc1nerator/, 'unit tests must include the incinerator pubkey');
});
