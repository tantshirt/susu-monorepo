import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import test from 'node:test';

const deployScript = 'scripts/deploy-mainnet.sh';
const dryrunScript = 'scripts/deploy-devnet-dryrun.sh';
const releaseWorkflow = '.github/workflows/release.yml';
const skipSentinel = 'audits/SKIP_AUDIT_GATE';
const atddDoc = 'tests/atdd/story-9-2-mainnet-deploy-burn.atdd.md';
const INCINERATOR = '1nc1nerator11111111111111111111111111111111';

test('Story 9.2: scripts/deploy-mainnet.sh exists and is executable', () => {
  assert.ok(existsSync(deployScript), `${deployScript} must exist`);
  const mode = statSync(deployScript).mode;
  assert.ok((mode & 0o111) !== 0, `${deployScript} must be executable`);
  const body = readFileSync(deployScript, 'utf8');
  assert.match(body, /^#!.+bash/m, 'must declare a bash shebang');
  assert.match(body, /set -euo pipefail/, 'must use strict mode');
});

test('Story 9.2: deploy-mainnet.sh enforces all preflight invariants', () => {
  const body = readFileSync(deployScript, 'utf8');
  assert.match(body, /SKIP_AUDIT_GATE/, 'must check SKIP_AUDIT_GATE sentinel absence');
  assert.match(body, /audit not yet signed off/i, 'must surface a clear audit-not-signed-off message');
  assert.match(body, /scripts\/check-audit-signoff\.sh/, 'must invoke the Story 9.1 gate');
  assert.match(body, /SUSU_AUDIT_GATE=enforce/, 'must invoke the gate in enforce mode (not skip)');
  assert.match(body, /solana --version/, 'must print solana --version');
  assert.match(body, /anchor --version/, 'must print anchor --version');
  assert.match(body, /solana config get/, 'must print solana config get');
  assert.match(body, /solana balance/, 'must check deploy keypair balance');
  assert.match(body, /scripts\/check-idl-hash\.sh|IDL_FREEZE/, 'must verify IDL hash freeze (FR28/29/30)');
  assert.match(body, /anchor build --verifiable/, 'must run anchor build --verifiable');
});

test('Story 9.2: deploy-mainnet.sh refuses to delete SKIP_AUDIT_GATE itself', () => {
  const body = readFileSync(deployScript, 'utf8');
  // The script may NAME the sentinel but must NOT call rm/unlink/git rm on it.
  assert.doesNotMatch(body, /\brm\s+[^#\n]*SKIP_AUDIT_GATE/, 'script must not rm SKIP_AUDIT_GATE');
  assert.doesNotMatch(body, /\bgit\s+rm\b[^#\n]*SKIP_AUDIT_GATE/, 'script must not git rm SKIP_AUDIT_GATE');
  assert.doesNotMatch(body, /\bunlink\s+[^#\n]*SKIP_AUDIT_GATE/, 'script must not unlink SKIP_AUDIT_GATE');
});

test('Story 9.2: deploy-mainnet.sh prints the irreversible commands and halts (does not auto-execute mainnet writes)', () => {
  const body = readFileSync(deployScript, 'utf8');
  assert.match(body, /solana program deploy/, 'must print the deploy command');
  assert.match(body, /set-upgrade-authority/, 'must print the authority-burn command');
  assert.match(body, /--final/, 'must use --final to make burn irreversible');
  assert.match(body, new RegExp(INCINERATOR), 'must reference the System Program incinerator pubkey');
  assert.match(body, /solana program show/, 'must print the post-burn verification command');
  assert.match(body, /EXECUTE/, 'must require operator to type EXECUTE in interactive mode');
  assert.match(body, /SUSU_DEPLOY_NONINTERACTIVE/, 'must support non-interactive (CI) dry-run mode');
  // Crucially: the script must NOT EXECUTE `solana program deploy` or
  // `solana program set-upgrade-authority` against any cluster. Strip comments
  // (lines whose first non-whitespace char is '#') and heredoc bodies, then
  // assert no executable line begins with one of the dangerous commands.
  const stripped = body
    // Drop heredoc bodies (cat <<EOF ... EOF). Tolerate either spacing.
    .replace(/<<\s*'?EOF'?[\s\S]*?\bEOF\b/g, '')
    .split('\n')
    // Drop full-line comments and blank lines.
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
  // Flag executable invocations: a line where `solana program deploy` (or
  // `solana program set-upgrade-authority`) appears as the start of a command
  // (i.e., preceded only by whitespace/`$()`/backticks/operators — NOT inside a
  // quoted string passed to log/printf/echo). We approximate by requiring the
  // line either start with optional whitespace then `solana`, or contain
  // `; solana ` / `&& solana ` / `| solana `. We exclude lines that contain a
  // bare double-quote before `solana` (those are inside a "..." string).
  for (const line of stripped.split('\n')) {
    if (!/\bsolana\s+program\s+(deploy|set-upgrade-authority)\b/.test(line)) continue;
    const isInvocation =
      /^\s*solana\s+program\s+(deploy|set-upgrade-authority)\b/.test(line) ||
      /(?:[;&|]\s*|\$\(\s*|`\s*)solana\s+program\s+(deploy|set-upgrade-authority)\b/.test(line);
    assert.ok(
      !isInvocation,
      `executable line invokes solana program deploy/set-upgrade-authority — must only appear inside heredoc printout: ${line.trim()}`,
    );
  }
});

test('Story 9.2: deploy-mainnet.sh exits 1 while SKIP_AUDIT_GATE is committed (current pre-audit state)', () => {
  // Pre-audit, the sentinel must be present; the script must refuse to proceed.
  assert.ok(existsSync(skipSentinel), `${skipSentinel} must still be committed (Story 9.1 sentinel)`);
  let exitCode = 0;
  let captured = '';
  try {
    captured = execFileSync('bash', [deployScript], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SUSU_DEPLOY_NONINTERACTIVE: '1' },
    });
  } catch (err) {
    exitCode = err.status ?? 1;
    captured = `${err.stdout ?? ''}\n${err.stderr ?? ''}`;
  }
  assert.equal(exitCode, 1, 'must exit 1 while SKIP_AUDIT_GATE is committed');
  assert.match(captured, /audit not yet signed off/i, 'failure must mention audit not yet signed off');
});

test('Story 9.2: scripts/deploy-devnet-dryrun.sh exists, executable, refuses mainnet target', () => {
  assert.ok(existsSync(dryrunScript), `${dryrunScript} must exist`);
  const mode = statSync(dryrunScript).mode;
  assert.ok((mode & 0o111) !== 0, `${dryrunScript} must be executable`);
  const body = readFileSync(dryrunScript, 'utf8');
  assert.match(body, /^#!.+bash/m, 'must declare bash shebang');
  assert.match(body, /set -euo pipefail/, 'must use strict mode');
  assert.match(body, /devnet/i, 'must default to devnet');
  assert.match(body, /mainnet/i, 'must reference mainnet (to refuse it)');
  assert.match(body, /refusing to run against mainnet/i, 'must refuse mainnet target explicitly');
  assert.match(body, /audits\/devnet-dryrun-/, 'must write evidence under audits/devnet-dryrun-*');
});

test('Story 9.2: a devnet dry-run evidence JSON is committed', () => {
  const audits = readdirSync('audits');
  const dryruns = audits.filter((f) => /^devnet-dryrun-\d{4}-\d{2}-\d{2}\.json$/.test(f));
  assert.ok(dryruns.length >= 1, 'at least one audits/devnet-dryrun-YYYY-MM-DD.json evidence file must be committed');
  const evidence = JSON.parse(readFileSync(`audits/${dryruns[0]}`, 'utf8'));
  assert.equal(evidence.story, '9.2', 'evidence must declare story=9.2');
  assert.equal(evidence.kind, 'devnet-dryrun', 'evidence must declare kind=devnet-dryrun');
  assert.match(evidence.cluster, /devnet|localnet|surfpool/i, 'evidence cluster must NOT be mainnet');
  assert.ok(evidence.idl_hash_frozen, 'evidence must capture frozen IDL hash');
  assert.match(evidence.program_id, /DRY-RUN/, 'program_id must be a DRY-RUN marker (no real program deployed)');
  assert.match(
    evidence.upgrade_authority_post_burn,
    /DRY-RUN/,
    'upgrade_authority_post_burn must be a DRY-RUN marker',
  );
});

test('Story 9.2: release.yml gates on audit-signoff before any deploy/release work', () => {
  assert.ok(existsSync(releaseWorkflow), `${releaseWorkflow} must exist`);
  const body = readFileSync(releaseWorkflow, 'utf8');
  assert.match(body, /audit-signoff:/, 'must declare an audit-signoff job');
  assert.match(body, /scripts\/check-audit-signoff\.sh/, 'audit-signoff job must run the gate script');
  assert.match(body, /SUSU_AUDIT_GATE:\s*enforce/, 'audit-signoff job must run in enforce mode');
  assert.match(body, /needs:\s*audit-signoff/, 'verify-build (or first deploy/publish job) must depend on audit-signoff');
});

test('Story 9.2: ATDD doc exists alongside the test', () => {
  assert.ok(existsSync(atddDoc), `${atddDoc} must exist`);
  const body = readFileSync(atddDoc, 'utf8');
  assert.match(body, /Story 9\.2/);
  assert.match(body, /incinerator/i);
  assert.match(body, new RegExp(INCINERATOR));
});
