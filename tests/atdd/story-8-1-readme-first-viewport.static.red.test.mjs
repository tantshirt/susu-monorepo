import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const README_PATH = 'README.md';
const CURVE_SVG_PATH = 'docs/assets/curve-hero.svg';
const RENDER_SCRIPT_PATH = 'scripts/render-curve-hero.mjs';

function read(path) {
  return readFileSync(path, 'utf8');
}

function indexOfOrFail(haystack, needle, label) {
  const idx = haystack.indexOf(needle);
  assert.notEqual(idx, -1, `${label}: expected README to contain ${JSON.stringify(needle)}`);
  return idx;
}

test('Story 8.1 first-viewport elements appear in the documented UX-DR25 order', () => {
  const readme = read(README_PATH);

  // Sentinels for each of the 8 first-viewport elements (UX-DR25).
  const heroBlockIdx = indexOfOrFail(readme, '<!-- susu:hero:start -->', 'hero block start');
  const heroEndIdx = indexOfOrFail(readme, '<!-- susu:hero:end -->', 'hero block end');
  assert.ok(heroEndIdx > heroBlockIdx, 'hero end must follow hero start');

  // 1. H1 hero SVG block (inline SVG with the project name in Geist Display 56/64 styling).
  const h1Idx = indexOfOrFail(readme, '<!-- susu:hero:h1 -->', 'H1 marker');

  // 2. One-line description / subhead.
  const subheadIdx = indexOfOrFail(readme, '<!-- susu:hero:subhead -->', 'subhead marker');

  // 3. Badge row.
  const badgeRowIdx = indexOfOrFail(readme, '<!-- susu:hero:badges -->', 'badge row marker');

  // 4. Copy-on-click `pnpm susu:demo` block with wall-clock subtext.
  const demoIdx = indexOfOrFail(readme, '<!-- susu:hero:demo -->', 'demo block marker');

  // 5. Watch-60s-demo CTA (placeholder until 8.6).
  const watchIdx = indexOfOrFail(readme, '<!-- susu:hero:watch-cta -->', 'watch CTA marker');

  // 6. Fork-on-github CTA.
  const forkIdx = indexOfOrFail(readme, '<!-- susu:hero:fork-cta -->', 'fork CTA marker');

  // 7. Curve novelty hook line.
  const hookIdx = indexOfOrFail(readme, '<!-- susu:hero:curve-hook -->', 'curve hook marker');

  // 8. Inline static SVG curve plot (referenced asset).
  const curveSvgIdx = indexOfOrFail(readme, '<!-- susu:hero:curve-svg -->', 'curve SVG marker');

  const ordered = [
    ['hero start', heroBlockIdx],
    ['H1', h1Idx],
    ['subhead', subheadIdx],
    ['badges', badgeRowIdx],
    ['demo', demoIdx],
    ['watch CTA', watchIdx],
    ['fork CTA', forkIdx],
    ['curve hook', hookIdx],
    ['curve SVG', curveSvgIdx],
    ['hero end', heroEndIdx],
  ];
  for (let i = 1; i < ordered.length; i++) {
    const [prevLabel, prevIdx] = ordered[i - 1];
    const [curLabel, curIdx] = ordered[i];
    assert.ok(curIdx > prevIdx, `${curLabel} must come after ${prevLabel} (got ${curIdx} <= ${prevIdx})`);
  }
});

test('Story 8.1 badge row points to the correct routes and files', () => {
  const readme = read(README_PATH);

  // Audit badge: either points to a real signed report or to the audit-pending state.
  const auditMatch = /audit-pending|audits\/[a-z0-9-]+-2026-\d{2}\.pdf|docs\/legal-engagement\.md|docs\/audit-engagement\.md/i;
  assert.match(readme, auditMatch, 'audit badge must link to a pending placeholder or signed report');

  // MIT license badge -> LICENSE file.
  assert.match(readme, /LICENSE/, 'MIT license badge must link to LICENSE');
  assert.match(readme, /license-MIT/i, 'MIT license badge must use shields license-MIT format');

  // Adversary badge -> /api/badge/adversary route.
  assert.match(readme, /\/api\/badge\/adversary/, 'adversary badge must reference /api/badge/adversary');

  // Upgrade-burned badge -> /api/badge/upgrade-burned route.
  assert.match(readme, /\/api\/badge\/upgrade-burned/, 'upgrade-burned badge must reference /api/badge/upgrade-burned');

  // CI badge -> ci.yml GitHub Actions badge.
  assert.match(readme, /workflows\/ci\.yml\/badge\.svg/, 'CI badge must use the ci.yml workflow badge URL');

  // Devnet + mainnet status badges present.
  assert.match(readme, /devnet/i, 'devnet status badge must be present');
  assert.match(readme, /mainnet/i, 'mainnet status badge must be present');
});

test('Story 8.1 demo block uses pnpm susu:demo and embeds wall-clock subtext', () => {
  const readme = read(README_PATH);

  // The fenced code block must contain `pnpm susu:demo` (copy-on-click target).
  assert.match(readme, /```[a-z]*\s*\npnpm susu:demo/, 'demo block must be a fenced code block running pnpm susu:demo');

  // Wall-clock subtext: matches the pattern "demo took <N|placeholder>s last verified at <sha|placeholder>".
  // Accept either a literal CI-substituted form or the documented `$COMMIT_SHA` / `<sha>` placeholder.
  const wallClock = /demo took\s+(?:\d+|<[^>]+>|\$[A-Z_]+)s\s+last verified at\s+(?:[0-9a-f]{7,40}|<[^>]+>|\$[A-Z_]+)/i;
  assert.match(readme, wallClock, 'wall-clock subtext must match "demo took <s>s last verified at <sha>"');
});

test('Story 8.1 inline static curve SVG asset exists and is referenced from the README', () => {
  assert.ok(existsSync(CURVE_SVG_PATH), `${CURVE_SVG_PATH} must exist (static curve hero asset)`);

  const svg = read(CURVE_SVG_PATH);
  assert.match(svg, /<svg[\s>]/i, 'curve hero asset must be a valid <svg> document');
  assert.match(svg, /<polyline/i, 'curve hero asset must include the polyline curve overlay');
  assert.match(svg, /<rect/i, 'curve hero asset must include bar <rect> elements');
  assert.doesNotMatch(svg, /<script/i, 'curve hero asset must not include any <script> tags (GitHub renders no JS)');

  const readme = read(README_PATH);
  assert.match(readme, /docs\/assets\/curve-hero\.svg/, 'README must reference docs/assets/curve-hero.svg');
});

test('Story 8.1 ships a render-curve-hero helper script for forkability', () => {
  assert.ok(existsSync(RENDER_SCRIPT_PATH), `${RENDER_SCRIPT_PATH} must exist`);
  const script = read(RENDER_SCRIPT_PATH);
  assert.match(script, /computeCollateralCurve/, 'render script must use computeCollateralCurve');
  assert.match(script, /docs\/assets\/curve-hero\.svg/, 'render script must write to docs/assets/curve-hero.svg');
});

test('Story 8.1 README contains the watch-60s-demo TODO and fork-on-github CTA', () => {
  const readme = read(README_PATH);

  // TODO marker for Story 8.6 (video embed).
  assert.match(readme, /TODO\s*\(?\s*8\.6\s*\)?|story\s*8\.6/i, 'watch-60s-demo CTA must include a Story 8.6 TODO marker');

  // Fork-on-github CTA — link to the canonical repo fork URL.
  assert.match(readme, /github\.com\/[\w.-]+\/[\w.-]+\/fork|Fork on GitHub/i, 'fork-on-github CTA must include a Fork link or Fork-on-GitHub label');
});

test('Story 8.1 README does not include script tags or break GitHub rendering', () => {
  const readme = read(README_PATH);
  assert.doesNotMatch(readme, /<script[\s>]/i, 'README must not contain <script> tags (GitHub strips them anyway)');
});
