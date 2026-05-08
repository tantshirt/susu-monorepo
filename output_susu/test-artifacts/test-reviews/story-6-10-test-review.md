# Story 6.10 Test Review

## Scope

- `tests/atdd/story-6-10-susu-demo-script.static.red.test.mjs`
- `tests/atdd/story-6-10-susu-demo-script.atdd.md`
- `scripts/susu-demo.sh`
- `scripts/susu-demo.mjs`
- `.github/workflows/ci.yml`

## Findings

### Fixed: Budget Assertion Needed Runtime Coverage

The initial ATDD verified that the shell contained a 60-second budget check, but it did not execute the shell path to prove an over-budget run fails. Added a focused runtime assertion that runs `bash scripts/susu-demo.sh` with `SUSU_DEMO_SKIP_PREFLIGHT=1` and `SUSU_DEMO_MAX_SECONDS=-1`, then verifies a non-zero exit with the NFR-P2 budget failure message.

### Fixed: Budget Failure Needed Its Own Bucket

Cursor Bugbot correctly flagged the over-budget path as misclassified under `dependency-mismatch`. The runtime assertion now verifies the `performance-budget` bucket and troubleshooting anchor, matching the actual recovery action for NFR-P2 regressions.

## Evidence

- `node --test tests/atdd/story-6-10-susu-demo-script.static.red.test.mjs`
- `pnpm test:atdd`

## Result

Approved after fix.
