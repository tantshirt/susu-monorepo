import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = new URL('../../', import.meta.url);
const tempRoot = fileURLToPath(new URL('tests/.tmp/story-5-8/', repoRoot));

function run(command, args) {
  return spawnSync(command, args, {
    cwd: new URL('.', repoRoot),
    encoding: 'utf8',
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resetTempDir(name) {
  const target = join(tempRoot, name);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  return target;
}

test('[P0] audit handoff script creates a gitignored tarball and manifest from complete fixture inputs', async () => {
  const outputDir = await resetTempDir('handoff');

  try {
    const result = run('bash', [
      'scripts/audit-handoff.sh',
      '--source-root',
      'tests/fixtures/audit-handoff-complete',
      '--output-dir',
      outputDir,
      '--date',
      '2026-05-08',
      '--firm',
      'fixture-firm',
    ]);

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const tarball = join(outputDir, 'handoff-2026-05-08.tar.gz');
    const manifest = join(outputDir, 'handoff-2026-05-08.MANIFEST.txt');
    assert.equal(existsSync(tarball), true, 'tarball must be created');
    assert.equal(existsSync(manifest), true, 'manifest must be created');

    const tarList = run('tar', ['-tzf', tarball]);
    assert.equal(tarList.status, 0, tarList.stderr);

    for (const expected of [
      'IDL_FREEZE.md', 'programs/susu/idl/susu.json',
      'tests/invariants/no_strategic_default.rs', 'audits/adversary/adversary-report.json',
      'docs/threat-model.md', 'tests/coverage/threat-model.md',
      'docs/collateral-curve.md', 'docs/fincen-cvc-framing.md',
      'output_susu/planning-artifacts/architecture.md',
      'AUDIT_HANDOFF_MANIFEST.txt',
    ]) {
      assert.match(tarList.stdout, new RegExp(escapeRegExp(expected)));
    }

    const gitignore = await readFile(new URL('.gitignore', repoRoot), 'utf8');
    assert.match(gitignore, /^audits\/handoff-\*\.tar\.gz$/m, 'handoff tarballs must not be committed');
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test('[P0] audit report citation checker passes with both NFR-S1 paths and fails when either is missing', async () => {
  const outputDir = await resetTempDir('citations');

  try {
    const goodReport = join(outputDir, 'good-report.pdf');
    const badReport = join(outputDir, 'bad-report.pdf');

    await writeFile(goodReport, [
      'Audit evidence reviewed:',
      'tests/invariants/no_strategic_default.rs',
      'audits/adversary/adversary-report.json',
      '',
    ].join('\n'));
    await writeFile(badReport, 'Audit evidence reviewed:\ntests/invariants/no_strategic_default.rs\n');

    const good = run('bash', ['scripts/check-audit-report-citations.sh', goodReport]);
    assert.equal(good.status, 0, good.stderr || good.stdout);

    const bad = run('bash', ['scripts/check-audit-report-citations.sh', badReport]);
    assert.notEqual(bad.status, 0, 'missing adversary report citation must fail');
    assert.match(bad.stderr + bad.stdout, /audits\/adversary\/adversary-report\.json/);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});
