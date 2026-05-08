---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-05-08
storyId: "5.1"
storyKey: story-5-1-no-strategic-default-proptest
storyFile: output_susu/implementation-artifacts/5-1-no-strategic-default-proptest.md
atddChecklistPath: tests/atdd/story-5-1-no-strategic-default-proptest.atdd.md
generatedTestFiles:
  - tests/atdd/story-5-1-no-strategic-default-proptest.static.red.test.mjs
  - tests/invariants/no_strategic_default.rs
  - programs/susu/tests/no_strategic_default.rs
inputDocuments:
  - output_susu/implementation-artifacts/5-1-no-strategic-default-proptest.md
  - output_susu/test-artifacts/test-design/test-design-epic-5.md
  - output_susu/implementation-artifacts/sprint-status.yaml
  - programs/susu/src/curve.rs
  - .github/workflows/ci.yml
---

# ATDD Checklist: Story 5.1 no strategic default proptest

## TDD Red Phase

Red-phase Rust property scaffolds live in `tests/invariants/no_strategic_default.rs` and are exposed to Cargo by `programs/susu/tests/no_strategic_default.rs`.

This repository is a Rust/Anchor backend project, so the ATDD output is an active compile-red scaffold rather than a skipped Playwright test: it imports the acceptance-level `susu::curve::expected_default_payoff` API before that API exists. The dev-story workflow turns it green by adding the canonical payoff helper, dependency wiring, and CI command.

## Generation Mode

AI generation, backend/Rust invariant mode. No browser recording or API endpoint scaffolds apply.

## Acceptance Criteria Coverage

| AC | Coverage | Test |
| --- | --- | --- |
| AC1 at least 10,000 `proptest!` cases over `n`, contribution, slot, and mint decimals | Proptest config sets `cases: 10_000`; tuple strategy samples `n in 3..=12`, contribution base units `$10-$10,000`, slot via `0..n`, and USDC/USDT mint labels with 6 decimals. | `tests/invariants/no_strategic_default.rs` |
| AC2 every case computes `expected_default_payoff` and asserts strictly negative | The property imports `susu::curve::expected_default_payoff` and asserts `payoff < 0`. | `tests/invariants/no_strategic_default.rs` |
| AC3 release run completes <=180 seconds | Release-mode command is the validation target; no expensive chain setup or Anchor validator is used. | `cargo test --test no_strategic_default --release` |
| AC4 CI runs on every PR | Static ATDD requires `.github/workflows/ci.yml` to include the release invariant command. | `tests/atdd/story-5-1-no-strategic-default-proptest.static.red.test.mjs` |
| AC5 command exits 0 against known-good curve | Cargo target includes the audit-path invariant file once the canonical helper is implemented. | `programs/susu/tests/no_strategic_default.rs` |
| AC6 flaws show counterexample inputs | Assertion message includes `n`, `slot`, `contribution`, `decimals`, mint label, and `expected_payoff`. | `tests/invariants/no_strategic_default.rs` |

## Step 3 Develop Handoff

1. Add `expected_default_payoff` to `programs/susu/src/curve.rs`, deriving the payoff from `calculate_collateral` without duplicating the collateral closed form.
2. Add `proptest` to `programs/susu/Cargo.toml` dev-dependencies.
3. Keep `tests/invariants/no_strategic_default.rs` as the audit-facing source and include it from `programs/susu/tests/no_strategic_default.rs`.
4. Wire `RUSTUP_TOOLCHAIN=stable cargo test --test no_strategic_default --release` into the `lint-and-build` CI job.

## Validation

- `node --test tests/atdd/story-5-1-no-strategic-default-proptest.static.red.test.mjs` should fail before implementation wiring and pass after all ACs are met.
- `RUSTUP_TOOLCHAIN=stable cargo test --test no_strategic_default --release` should fail red before `expected_default_payoff` exists, then pass after implementation.

## Epic 5 Test Design Traceability

| Test ID | Static / test coverage |
| --- | --- |
| 5.1-UNIT-001 | Proptest case count and sampled domains |
| 5.1-UNIT-002 | Canonical curve API import and negative payoff assertion |
| 5.1-UNIT-003 | Static check forbids duplicated closed-form collateral math in the invariant |
| 5.1-UNIT-004 | CI release-mode command |
| 5.1-UNIT-005 | Fixed proptest RNG seed and regression persistence path |
| 5.1-UNIT-006 | Counterexample message fields |
