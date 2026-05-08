import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const repoRoot = new URL('../../', import.meta.url);

async function readRepoFile(path) {
  return readFile(new URL(path, repoRoot), 'utf8');
}

test('[P0] audits README is a complete audit engagement index', async () => {
  const readme = await readRepoFile('audits/README.md');

  assert.match(readme, /^# Audits$/m);
  assert.match(readme, /^## Engagement Status$/m);
  assert.match(
    readme,
    /\|\s*Firm\s*\|\s*Scope\s*\|\s*Engagement Date\s*\|\s*Expected Delivery\s*\|\s*Status\s*\|\s*Report Path\s*\|/,
    'engagement table must expose the required audit status fields',
  );
  assert.match(readme, /Primary audit/i, 'index must include the primary audit engagement row');
  assert.match(readme, /audits\/audit-sow-summary\.md|audits\/audit-sow\.pdf/, 'index must reference SOW or summary handling');
  assert.match(readme, /^## Reproduction & Verification$/m);
  assert.match(readme, /tests\/invariants\/no_strategic_default\.rs/);
  assert.match(readme, /audits\/adversary\/adversary-report\.json/);
  assert.match(readme, /^## Report Landing Checklist$/m);
  assert.match(readme, /audits\/\{firm-slug\}-\{YYYY-MM\}\.pdf/);
  assert.match(readme, /^## README Badge Transition$/m);
  assert.match(readme, /Epic 8/i, 'badge wiring must remain deferred to Epic 8');
  assert.match(readme, /^## Findings Tracker$/m);
  assert.match(readme, /audit-finding/);
  assert.match(readme, /audit-finding-resolved/);
});

test('[P1] confidential SOW summary exists when public SOW PDF is absent', async () => {
  const publicSowExists = existsSync(new URL('audits/audit-sow.pdf', repoRoot));
  const summary = await readRepoFile('audits/audit-sow-summary.md');

  if (!publicSowExists) {
    assert.match(summary, /^# Audit SOW Summary$/m);
    assert.match(summary, /confidential/i);
    assert.match(summary, /Scope/i);
    assert.match(summary, /Expected Delivery/i);
    assert.doesNotMatch(summary, /pricing|rate card|proprietary methodology/i);
  }
});
