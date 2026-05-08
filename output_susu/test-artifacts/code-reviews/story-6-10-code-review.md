# Story 6.10 Code Review

## Scope

Reviewed branch diff against `origin/main` for Story 6.10.

## Findings

### Fixed: Surfpool Smoke Should Not Auto-Deploy

The initial CI smoke started Surfpool from the repository root without disabling automatic deployment. Because Surfpool can auto-generate/run deployment runbooks in a Solana program directory, the smoke job could spend time on deployment or fail before the demo runner starts. The demo only needs a devnet-compatible RPC fork, so the workflow now starts Surfpool with `--ci --no-deploy --no-tui --no-studio`.

## Evidence

- `node --test tests/atdd/story-6-10-susu-demo-script.static.red.test.mjs`
- `pnpm test:atdd`
- `SUSU_DEMO_SKIP_PREFLIGHT=1 SUSU_DEMO_MAX_SECONDS=60 pnpm susu:demo`
- `bash scripts/check-patterns.sh`
- `bash scripts/check-sdk-parity.sh`

## Result

Approved after fix.
