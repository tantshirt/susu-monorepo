---
storyId: '5.5'
storyKey: 5-5-collateral-curve-doc
reviewDate: '2026-05-08'
reviewMode: full
specFile: output_susu/implementation-artifacts/5-5-collateral-curve-doc.md
baseRef: origin/main
headRef: HEAD
---

# Code Review: Story 5.5 Collateral Curve Doc

## Scope

Reviewed the branch diff against `origin/main`, with Story 5.5 and the Epic 5 test design as context.

Changed files reviewed:

- `docs/collateral-curve.md`
- `output_susu/implementation-artifacts/5-5-collateral-curve-doc.md`
- `output_susu/implementation-artifacts/sprint-status.yaml`
- `output_susu/test-artifacts/atdd-checklist-5-5-collateral-curve-doc.md`
- `output_susu/test-artifacts/test-reviews/story-5-5-test-review.md`
- `tests/atdd/story-5-5-collateral-curve-doc.atdd.md`
- `tests/atdd/story-5-5-collateral-curve-doc.static.red.test.mjs`

## Findings

### Fixed During Review

1. **Missing named scenario link from Epic 5 test design**
   - Source: Acceptance Auditor
   - Location: `docs/collateral-curve.md`, `tests/atdd/story-5-5-collateral-curve-doc.static.red.test.mjs`
   - Detail: Story 5.5 issue #48 requires invariant and adversary report paths, but the loaded Epic 5 test design also lists `5.5-DOC-003` requiring the named 30% Cartel scenario path to resolve. The initial doc and guard omitted `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs`.
   - Resolution: Added the scenario citation to the verification artifacts, BDD scenario, checklist guidance, and static link guard.

## Triage Summary

- Decision-needed: 0
- Patch findings: 1 fixed
- Deferred: 0
- Dismissed: 0
- Failed layers: none

## Validation After Fix

- `node --test tests/atdd/story-5-5-collateral-curve-doc.static.red.test.mjs`: pass.
- `pnpm test:atdd`: pass.

## Result

All code-review findings were fixed. Story remains in `review` until PR CI and Cursor/Bug Bot gates pass, per the Epic 5 final-story pipeline.
