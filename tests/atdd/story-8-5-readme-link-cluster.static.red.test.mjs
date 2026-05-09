import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const README_PATH = 'README.md';
const LATEST_LOG_PATH = 'log/latest.md';
const SYNC_SCRIPT_PATH = 'scripts/sync-latest-log.sh';
const LINK_CHECK_WORKFLOW = '.github/workflows/markdown-link-check.yml';
const PACKAGE_JSON = 'package.json';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('Story 8.5 README contains link cluster sentinels positioned below the hero block', () => {
  const readme = read(README_PATH);

  const heroEndIdx = readme.indexOf('<!-- susu:hero:end -->');
  assert.notEqual(heroEndIdx, -1, 'README must still contain the hero end sentinel from Story 8.1');

  const startIdx = readme.indexOf('<!-- susu:linkcluster:start -->');
  const endIdx = readme.indexOf('<!-- susu:linkcluster:end -->');
  assert.notEqual(startIdx, -1, 'README must contain <!-- susu:linkcluster:start --> sentinel');
  assert.notEqual(endIdx, -1, 'README must contain <!-- susu:linkcluster:end --> sentinel');
  assert.ok(startIdx > heroEndIdx, 'link cluster must appear AFTER the hero block end sentinel');
  assert.ok(endIdx > startIdx, 'link cluster end sentinel must appear after the start sentinel');
});

test('Story 8.5 link cluster has a "Verify every claim" (or similar) section heading', () => {
  const readme = read(README_PATH);
  const startIdx = readme.indexOf('<!-- susu:linkcluster:start -->');
  const endIdx = readme.indexOf('<!-- susu:linkcluster:end -->');
  const cluster = readme.slice(startIdx, endIdx);

  // Per epic AC: "Verify every claim" or similarly-titled. Accept H2 with that or a synonym.
  const headingMatch = /^##\s+(Verify every claim|Verify the claims|Verify every assertion|Verify the receipts)/m;
  assert.match(cluster, headingMatch, 'link cluster must contain an H2 heading like "## Verify every claim"');
});

test('Story 8.5 link cluster references all five required claim verifiers', () => {
  const readme = read(README_PATH);
  const startIdx = readme.indexOf('<!-- susu:linkcluster:start -->');
  const endIdx = readme.indexOf('<!-- susu:linkcluster:end -->');
  const cluster = readme.slice(startIdx, endIdx);

  // 1. Curve invariant doc
  assert.match(cluster, /docs\/collateral-curve\.md/, 'link cluster must reference docs/collateral-curve.md');
  assert.ok(existsSync('docs/collateral-curve.md'), 'docs/collateral-curve.md must exist');

  // 2. Adversary report JSON
  assert.match(cluster, /audits\/adversary\/adversary-report\.json/, 'link cluster must reference audits/adversary/adversary-report.json');
  assert.ok(existsSync('audits/adversary/adversary-report.json'), 'audits/adversary/adversary-report.json must exist');

  // 3. Legal opinion PDF
  assert.match(cluster, /docs\/legal-opinion\.pdf/, 'link cluster must reference docs/legal-opinion.pdf');
  assert.ok(existsSync('docs/legal-opinion.pdf'), 'docs/legal-opinion.pdf must exist');

  // 4. Latest log via log/latest.md
  assert.match(cluster, /log\/latest\.md/, 'link cluster must reference log/latest.md');
  assert.ok(existsSync(LATEST_LOG_PATH), 'log/latest.md must exist as a regular file');

  // 5. At least one ecosystem-partner placeholder via examples/with-*
  const partnerMatch = /examples\/with-(privy|squads|token-extensions)/;
  assert.match(cluster, partnerMatch, 'link cluster must reference at least one examples/with-* directory as partner placeholder');
  const partnerDirs = ['examples/with-privy', 'examples/with-squads', 'examples/with-token-extensions'];
  assert.ok(partnerDirs.some((p) => existsSync(p)), 'at least one referenced examples/with-* directory must exist');
});

test('Story 8.5 ships log/latest.md as a regular file (not a symlink)', () => {
  assert.ok(existsSync(LATEST_LOG_PATH), 'log/latest.md must exist');
  const stat = statSync(LATEST_LOG_PATH);
  assert.ok(stat.isFile(), 'log/latest.md must be a regular file (Windows-friendly, not a symlink)');
  const contents = read(LATEST_LOG_PATH);
  assert.ok(contents.length > 0, 'log/latest.md must not be empty');
});

test('Story 8.5 ships scripts/sync-latest-log.sh helper to keep log/latest.md in sync', () => {
  assert.ok(existsSync(SYNC_SCRIPT_PATH), `${SYNC_SCRIPT_PATH} must exist`);
  const script = read(SYNC_SCRIPT_PATH);
  assert.match(script, /^#!\/(?:usr\/)?bin\/(?:env\s+)?(?:bash|sh)/, 'sync script must declare a shell shebang');
  assert.match(script, /log\/latest\.md/, 'sync script must mention log/latest.md');
  assert.match(script, /log\//, 'sync script must reference the log/ directory');
});

test('Story 8.5 ships a markdown-link-check CI workflow', () => {
  assert.ok(existsSync(LINK_CHECK_WORKFLOW), `${LINK_CHECK_WORKFLOW} must exist`);
  const wf = read(LINK_CHECK_WORKFLOW);
  assert.match(wf, /markdown-link-check/, 'workflow must invoke markdown-link-check');
  assert.match(wf, /README\.md/, 'workflow must check README.md');
  assert.match(wf, /pull_request/, 'workflow must run on pull_request');
});

test('Story 8.5 root package.json defines a link:check script', () => {
  const pkg = JSON.parse(read(PACKAGE_JSON));
  assert.ok(pkg.scripts, 'package.json must have a scripts block');
  assert.ok(pkg.scripts['link:check'], 'package.json must define a link:check script');
  assert.match(pkg.scripts['link:check'], /markdown-link-check/, 'link:check script must invoke markdown-link-check');
});

test('Story 8.5 hero block above susu:hero:end is unchanged in shape (still contains H1 + curve SVG markers)', () => {
  const readme = read(README_PATH);
  const heroEndIdx = readme.indexOf('<!-- susu:hero:end -->');
  const hero = readme.slice(0, heroEndIdx);
  // We do NOT edit the hero block. These markers must still be present.
  assert.match(hero, /<!-- susu:hero:start -->/, 'hero block must retain its start sentinel');
  assert.match(hero, /<!-- susu:hero:h1 -->/, 'hero block must retain H1 marker');
  assert.match(hero, /<!-- susu:hero:curve-svg -->/, 'hero block must retain curve SVG marker');
});
