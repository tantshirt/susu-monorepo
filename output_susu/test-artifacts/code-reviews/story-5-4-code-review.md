---
storyId: '5.4'
storyKey: 5-4-deterministic-adversary-report
reviewDate: '2026-05-08'
reviewMode: full
diffBase: origin/main
specFile: output_susu/implementation-artifacts/5-4-deterministic-adversary-report.md
---

# Code Review: Story 5.4 Byte-deterministic Adversary Report

## Scope

Reviewed branch diff against `origin/main` with the Story 5.4 spec as acceptance context.

## Review Layers

- Blind Hunter: completed
- Edge Case Hunter: completed
- Acceptance Auditor: completed

## Findings

### Fixed During Review

1. **Canonical artifact reproduction used moving `HEAD` seed**
   - **Category:** Acceptance / determinism
   - **Evidence:** `audits/adversary/README.md` originally instructed `COMMIT_SHA="$(git rev-parse HEAD)"` to reproduce the checked-in report, but committing the report changes `HEAD`, so the command would regenerate bytes with a different seed than the committed artifact.
   - **Fix:** The audit README now reproduces the committed artifact from `run_metadata.seed`, explains the self-reference constraint, and CI has a second `CHECK_CANONICAL=1` invocation that regenerates with the recorded seed and compares bytes against `audits/adversary/adversary-report.json`.

## Triage Summary

| Bucket | Count |
| --- | ---: |
| Decision needed | 0 |
| Patch | 1 fixed |
| Defer | 0 |
| Dismissed | 0 |

## Validation After Fix

- `node --test tests/atdd/story-5-4-deterministic-adversary-report.static.red.test.mjs` passed: 5 tests.
- `COMMIT_SHA="$(node -e "console.log(require('./audits/adversary/adversary-report.json').run_metadata.seed)")" CHECK_CANONICAL=1 CIRCLES=10000 bash scripts/check-adversary-determinism.sh` passed.

## Result

Clean review after fix. No remaining code-review findings.

