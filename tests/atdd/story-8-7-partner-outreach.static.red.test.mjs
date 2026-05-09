import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const OUTREACH_README = 'docs/outreach/README.md';
const TRACKER = 'docs/outreach/tracker.md';
const DM_TEMPLATE = 'docs/outreach/dm-template.md';
const SWAP_SCRIPT = 'scripts/swap-partner-reference.sh';
const README_PATH = 'README.md';
const LOG_PATH = 'log/2026-05-09.md';

const EMAIL_TEMPLATES = {
  squads: 'docs/outreach/email-template-squads.md',
  privy: 'docs/outreach/email-template-privy.md',
  helius: 'docs/outreach/email-template-helius.md',
  'token-extensions': 'docs/outreach/email-template-token-extensions.md',
};

function read(path) {
  return readFileSync(path, 'utf8');
}

test('Story 8.7 outreach campaign README exists with success criteria and template-usage guide', () => {
  assert.ok(existsSync(OUTREACH_README), `${OUTREACH_README} must exist`);
  const doc = read(OUTREACH_README);
  // Mention all four partners.
  assert.match(doc, /Squads/i, 'outreach README must reference Squads');
  assert.match(doc, /Privy/i, 'outreach README must reference Privy');
  assert.match(doc, /Helius/i, 'outreach README must reference Helius');
  assert.match(doc, /Token[\s-]?Extensions/i, 'outreach README must reference Token Extensions');
  // Describe success criteria.
  assert.match(doc, /tweet|post|doc|reference/i, 'outreach README must describe what counts as a success');
  assert.match(doc, /tracker/i, 'outreach README must reference the tracker');
});

test('Story 8.7 ships per-partner email templates with placeholders and asset links', () => {
  for (const [partner, path] of Object.entries(EMAIL_TEMPLATES)) {
    assert.ok(existsSync(path), `${path} must exist`);
    const tpl = read(path);

    // Subject line.
    assert.match(tpl, /Subject:/i, `${path} must contain a Subject: line`);

    // Personalization placeholder.
    assert.match(tpl, /\{\{recipient_name\}\}/, `${path} must contain {{recipient_name}} placeholder`);

    // Asset link to a runnable example.
    // Helius doesn't have a dedicated example dir; it links to with-privy (Helius RPC fallback) per the integration story.
    if (partner === 'helius') {
      assert.match(tpl, /examples\/with-privy/, `${path} must link to examples/with-privy/ (Helius RPC fallback)`);
    } else {
      const re = new RegExp(`examples/with-${partner}`);
      assert.match(tpl, re, `${path} must link to examples/with-${partner}/`);
    }

    // Demo video reference (Story 8.6 asset).
    assert.match(tpl, /demo|video/i, `${path} must reference the demo video as a supplementary asset`);
  }
});

test('Story 8.7 ships a short DM template variant for Twitter / Discord', () => {
  assert.ok(existsSync(DM_TEMPLATE), `${DM_TEMPLATE} must exist`);
  const dm = read(DM_TEMPLATE);
  assert.match(dm, /github\.com\/tantshirt\/susu-monorepo|github\.com\//i, 'DM template must include a GitHub repo link');
  // Should be terse — keep the DM body under ~80 words to enforce the "1-2 sentences" intent.
  // Strip code fences and whitespace before counting.
  const body = dm.replace(/```[\s\S]*?```/g, '').replace(/^#.*$/gm, '');
  const words = body.split(/\s+/).filter(Boolean).length;
  assert.ok(words <= 200, `DM template body should be terse (≤200 words including framing); got ${words}`);
});

test('Story 8.7 ships an outreach tracker with all four partners initialized to pending', () => {
  assert.ok(existsSync(TRACKER), `${TRACKER} must exist`);
  const t = read(TRACKER);
  // Markdown table headers.
  assert.match(t, /Partner/i, 'tracker must have a Partner column');
  assert.match(t, /Sent/i, 'tracker must have a Sent column');
  assert.match(t, /Channel/i, 'tracker must have a Channel column');
  assert.match(t, /Status/i, 'tracker must have a Status column');
  assert.match(t, /Notes/i, 'tracker must have a Notes column');

  // All four partners listed.
  assert.match(t, /Squads/i, 'tracker must list Squads');
  assert.match(t, /Privy/i, 'tracker must list Privy');
  assert.match(t, /Helius/i, 'tracker must list Helius');
  assert.match(t, /Token[\s-]?Extensions/i, 'tracker must list Token Extensions');

  // Initial state: pending for all four partners (count >= 4).
  const pendingMatches = t.match(/pending/gi) ?? [];
  assert.ok(pendingMatches.length >= 4, `tracker must initialize all four partners as pending; got ${pendingMatches.length}`);
});

test('Story 8.7 ships scripts/swap-partner-reference.sh helper supporting --partner / --url and --drop', () => {
  assert.ok(existsSync(SWAP_SCRIPT), `${SWAP_SCRIPT} must exist`);
  const stat = statSync(SWAP_SCRIPT);
  // Executable bit set (any of user/group/other).
  assert.ok((stat.mode & 0o111) !== 0, `${SWAP_SCRIPT} must be executable`);
  const s = read(SWAP_SCRIPT);
  assert.match(s, /^#!\/(?:usr\/)?bin\/(?:env\s+)?(?:bash|sh)/, 'swap script must declare a shell shebang');
  assert.match(s, /--partner/, 'swap script must accept a --partner flag');
  assert.match(s, /--url/, 'swap script must accept a --url flag');
  assert.match(s, /--drop/, 'swap script must accept a --drop flag');
  assert.match(s, /susu:linkcluster:partner/, 'swap script must target the susu:linkcluster:partner sentinel');
});

test('Story 8.7 README contains the susu:linkcluster:partner sentinel inside the existing link cluster block', () => {
  const readme = read(README_PATH);
  const startIdx = readme.indexOf('<!-- susu:linkcluster:start -->');
  const endIdx = readme.indexOf('<!-- susu:linkcluster:end -->');
  assert.notEqual(startIdx, -1, 'README must still contain the linkcluster:start sentinel from Story 8.5');
  assert.notEqual(endIdx, -1, 'README must still contain the linkcluster:end sentinel from Story 8.5');

  const partnerIdx = readme.indexOf('<!-- susu:linkcluster:partner -->');
  assert.notEqual(partnerIdx, -1, 'README must contain <!-- susu:linkcluster:partner --> sentinel');
  assert.ok(partnerIdx > startIdx && partnerIdx < endIdx, 'partner sentinel must live inside the linkcluster block');

  // The four other claim verifiers from Story 8.5 must still be present (regression guard).
  const cluster = readme.slice(startIdx, endIdx);
  assert.match(cluster, /docs\/collateral-curve\.md/, '8.5 curve doc verifier must remain');
  assert.match(cluster, /audits\/adversary\/adversary-report\.json/, '8.5 adversary verifier must remain');
  assert.match(cluster, /docs\/legal-opinion\.pdf/, '8.5 legal opinion verifier must remain');
  assert.match(cluster, /log\/latest\.md/, '8.5 latest-log verifier must remain');
});

test('Story 8.7 daily log entry records the outreach kickoff with the four partners listed', () => {
  assert.ok(existsSync(LOG_PATH), `${LOG_PATH} must exist`);
  const log = read(LOG_PATH);
  assert.match(log, /Story 8\.7/i, 'log must contain a Story 8.7 section');
  assert.match(log, /outreach/i, 'log must reference the outreach campaign');
  // All four partners named in the log entry.
  assert.match(log, /Squads/i, 'log must mention Squads');
  assert.match(log, /Privy/i, 'log must mention Privy');
  assert.match(log, /Helius/i, 'log must mention Helius');
  assert.match(log, /Token[\s-]?Extensions/i, 'log must mention Token Extensions');
});
