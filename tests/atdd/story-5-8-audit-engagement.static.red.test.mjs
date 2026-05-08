import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const repoRoot = new URL('../../', import.meta.url);

async function readRepoFile(path) {
  return readFile(new URL(path, repoRoot), 'utf8');
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: new URL('.', repoRoot),
    encoding: 'utf8',
    ...options,
  });
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

test('[P0] audit handoff script creates a gitignored tarball and manifest from complete fixture inputs', async () => {
  const workdir = await mkdtemp(join(tmpdir(), 'susu-audit-handoff-'));

  try {
    const result = run('bash', [
      'scripts/audit-handoff.sh',
      '--source-root',
      'tests/fixtures/audit-handoff-complete',
      '--output-dir',
      workdir,
      '--date',
      '2026-05-08',
      '--firm',
      'fixture-firm',
    ]);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(existsSync(join(workdir, 'handoff-2026-05-08.tar.gz')), true, 'tarball must be created');
    assert.equal(existsSync(join(workdir, 'handoff-2026-05-08.MANIFEST.txt')), true, 'manifest must be created');

    const tarList = run('tar', ['-tzf', join(workdir, 'handoff-2026-05-08.tar.gz')]);
    assert.equal(tarList.status, 0, tarList.stderr);

    for (const expected of [
      'IDL_FREEZE.md',
      'programs/susu/idl/susu.json',
      'tests/invariants/no_strategic_default.rs',
      'audits/adversary/adversary-report.json',
      'docs/threat-model.md',
      'tests/coverage/threat-model.md',
      'docs/collateral-curve.md',
      'docs/fincen-cvc-framing.md',
      'output_susu/planning-artifacts/architecture.md',
      'AUDIT_HANDOFF_MANIFEST.txt',
    ]) {
      assert.match(tarList.stdout, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }

    const gitignore = await readRepoFile('.gitignore');
    assert.match(gitignore, /^audits\/handoff-\*\.tar\.gz$/m, 'handoff tarballs must not be committed');
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
});

test('[P0] audit report citation checker passes with both NFR-S1 paths and fails when either is missing', async () => {
  const workdir = await mkdtemp(join(tmpdir(), 'susu-audit-citations-'));

  try {
    const goodReport = join(workdir, 'good-report.pdf');
    const badReport = join(workdir, 'bad-report.pdf');

    await writeFile(
      goodReport,
      [
        'Audit evidence reviewed:',
        'tests/invariants/no_strategic_default.rs',
        'audits/adversary/adversary-report.json',
        '',
      ].join('\n'),
    );
    await writeFile(badReport, 'Audit evidence reviewed:\ntests/invariants/no_strategic_default.rs\n');

    const good = run('bash', ['scripts/check-audit-report-citations.sh', goodReport]);
    assert.equal(good.status, 0, good.stderr || good.stdout);

    const bad = run('bash', ['scripts/check-audit-report-citations.sh', badReport]);
    assert.notEqual(bad.status, 0, 'missing adversary report citation must fail');
    assert.match(bad.stderr + bad.stdout, /audits\/adversary\/adversary-report\.json/);
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
});
