# Story 5.5: docs/collateral-curve.md formal write-up (FR24)

## Status

ready-for-dev

## Story

As an auditor, judge, or curious developer,
I want `docs/collateral-curve.md` containing the closed-form formula, derivation, worked examples for `n in {3, 5, 10}`, a proof sketch, and explicit references to `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json` by file path,
so that the math is legible and every claim links to its verifier.

## Acceptance Criteria

1. Given Stories 5.1 and 5.4 land, when `docs/collateral-curve.md` is committed, then the doc contains a `## TL;DR` first section restating the Curve Invariant in one paragraph.
2. The doc contains the closed-form formula in inline LaTeX or unambiguous notation.
3. The doc contains a derivation section walking through the strategic-default analysis at slot `i` and showing why `expected_default_payoff(i) < 0` follows from the curve definition.
4. The doc contains worked examples for `n = 3`, `n = 5`, and `n = 10` with concrete USDC numbers.
5. The doc contains a proof sketch that is informal but rigorous; a full formal proof remains a v2 stretch goal.
6. The doc explicitly cites `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json` by file path.
7. The doc passes a non-cryptoeconomist comprehension test via at least one external developer review, with notes captured in this story's completion record.

## Tasks / Subtasks

- [ ] Create Story 5.5 ATDD artifacts (AC: 1-7)
  - [ ] Add `tests/atdd/story-5-5-collateral-curve-doc.atdd.md`
  - [ ] Add `tests/atdd/story-5-5-collateral-curve-doc.static.red.test.mjs`
  - [ ] Add `output_susu/test-artifacts/atdd-checklist-5-5-collateral-curve-doc.md`
- [ ] Write `docs/collateral-curve.md` (AC: 1-6)
  - [ ] Make `## TL;DR` the first section after the H1.
  - [ ] State the Curve Invariant and the closed-form collateral formula.
  - [ ] Derive the slot-`i` payoff using the same sign convention as `programs/susu/src/curve.rs`.
  - [ ] Include worked USDC examples for `n = 3`, `n = 5`, and `n = 10`.
  - [ ] Include an informal proof sketch with explicitly stated assumptions.
  - [ ] Cite verifier paths exactly.
- [ ] Capture comprehension review evidence (AC: 7)
  - [ ] Record reviewer role, review date, summary, and outcome in the Dev Agent Record.
  - [ ] Ensure the reviewer can restate the invariant without cryptoeconomics background.
- [ ] Run story-local checks and repository checks
  - [ ] `node --test tests/atdd/story-5-5-collateral-curve-doc.static.red.test.mjs`
  - [ ] `pnpm test:atdd`

## Dev Notes

### Preconditions

- Story 5.1 is merged and marked `done`; the audit-facing invariant exists at `tests/invariants/no_strategic_default.rs`.
- Story 5.4 is merged and marked `done`; the canonical adversary report exists at `audits/adversary/adversary-report.json`.
- This story is unblocked because both upstream evidence artifacts are now available from `origin/main`.

### Formula and Sign Convention

- `programs/susu/src/curve.rs` is the canonical implementation source.
- The curve currently defines `required_collateral(slot, n, contribution) = contribution * (2*n - 1 - slot)`.
- The payoff convention from the curve module is:
  `payout = (n - 1) * contribution`,
  `paid_before_payout = slot * contribution`,
  `expected_default_payoff = payout - paid_before_payout - collateral`.
- Substituting the curve must show `expected_default_payoff(i) = -n * contribution`, which is strictly negative for valid `n` and positive contribution.

### Testing Guidance

- Keep the ATDD guard as a static Node test matching existing `tests/atdd/*.red.test.mjs` conventions.
- Verify worked example rows against the closed-form formula instead of accepting prose-only examples.
- Link checks must use real repository paths and fail if cited evidence files disappear.

### ATDD Artifacts

- Checklist: `output_susu/test-artifacts/atdd-checklist-5-5-collateral-curve-doc.md`
- BDD scenarios: `tests/atdd/story-5-5-collateral-curve-doc.atdd.md`
- Static red test: `tests/atdd/story-5-5-collateral-curve-doc.static.red.test.mjs`

### References

- GitHub issue: https://github.com/tantshirt/susu-monorepo/issues/48
- Epic 5 test design: `output_susu/test-artifacts/test-design/test-design-epic-5.md`
- Curve module: `programs/susu/src/curve.rs`
- Invariant proptest: `tests/invariants/no_strategic_default.rs`
- Adversary report: `audits/adversary/adversary-report.json`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Created from GitHub issue #48 because the sprint-status key existed but the story file was missing from this checkout.

### Completion Notes List

- Pending implementation.

### Comprehension Review

- Pending external non-cryptoeconomist developer review.

### File List

- `output_susu/implementation-artifacts/5-5-collateral-curve-doc.md`

### Change Log

- 2026-05-08: Initialized Story 5.5 from issue #48 and upstream Epic 5 evidence artifacts.
