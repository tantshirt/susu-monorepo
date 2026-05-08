# Story 6.10 Code Review

## Scope

Reviewed branch diff against `origin/main` for Story 6.10.

## Findings

### Fixed: Surfpool Smoke Should Not Auto-Deploy

The initial CI smoke started Surfpool from the repository root without disabling automatic deployment. Because Surfpool can auto-generate/run deployment runbooks in a Solana program directory, the smoke job could spend time on deployment or fail before the demo runner starts. The demo only needs a devnet-compatible RPC fork, so the workflow now starts Surfpool with `--ci --no-deploy --no-tui --no-studio`.

### Fixed: Dependency Bucket Shadowed RPC Failures

Cursor Bugbot flagged broad `node`, `solana`, and `version` matches that could classify ordinary RPC failures as dependency mismatches. The shell and runner now match dependency issues only for explicit missing module/package, missing command, unsupported toolchain, or version-mismatch signals, leaving transport failures to the `rpc-reachability` bucket.

### Fixed: Surfpool Version Check Needed Current-Step PATH

Cursor Bugbot flagged that appending Surfpool install paths to `GITHUB_PATH` only affects later workflow steps. The install step now exports `$HOME/.local/bin` and `$HOME/.cargo/bin` before running `surfpool --version`, matching the Solana CLI install pattern.

## Evidence

- `node --test tests/atdd/story-6-10-susu-demo-script.static.red.test.mjs`
- `pnpm test:atdd`
- `SUSU_DEMO_SKIP_PREFLIGHT=1 SUSU_DEMO_MAX_SECONDS=60 pnpm susu:demo`
- `bash scripts/check-patterns.sh`
- `bash scripts/check-sdk-parity.sh`

## Result

Approved after fix.
