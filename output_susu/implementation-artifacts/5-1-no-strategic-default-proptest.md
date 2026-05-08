# Story 5.1: tests/invariants/no_strategic_default.rs proptest

## Status

review

## Story

As an auditor or judge,
I want `tests/invariants/no_strategic_default.rs` running at least 10,000 randomized proptest cases proving `expected_default_payoff(i, curve) < 0` for every rotation slot `i in [0, n)` across `n in [3, 12]`, contribution in `[$10, $10,000]`, for both USDC and USDT,
so that the Curve Invariant is verifiable from a clean clone with one command and the proptest is the property-test artifact the audit firm cites by file path.

## Acceptance Criteria

1. Given the curve module from Story 3.1, when `cargo test --test no_strategic_default --release` runs, then the test executes at least 10,000 cases via the `proptest!` macro with strategies sampling `n in [3, 12]`, `contribution in [10_000_000, 10_000_000_000]` base units, `slot in [0, n)`, and 6-decimal USDC/USDT mint variants.
2. For every case, the test computes `expected_default_payoff(slot, n, contribution, decimals)` and asserts the result is strictly negative.
3. The test completes in 180 seconds or less on a 4-core developer laptop.
4. The test is wired into `.github/workflows/ci.yml` and runs on every PR.
5. `cargo test --test no_strategic_default` exits 0 against the curve module's known-good state.
6. If the curve has a flaw, the test fails with a counterexample showing `n`, `slot`, `contribution`, and `expected_payoff` values.

## Tasks / Subtasks

- [x] Create ATDD artifacts for Story 5.1 (AC: 1-6)
  - [x] Add `tests/atdd/story-5-1-no-strategic-default-proptest.atdd.md`
  - [x] Add `tests/atdd/story-5-1-no-strategic-default-proptest.static.red.test.mjs`
  - [x] Add red-phase Rust property scaffold at `tests/invariants/no_strategic_default.rs`
- [x] Add the canonical strategic-default payoff API to the curve module (AC: 2, 5)
  - [x] Expose `expected_default_payoff(slot, n, contribution, decimals) -> Result<i128, SusuError>`
  - [x] Reuse `calculate_collateral`; do not duplicate closed-form collateral math
  - [x] Use checked arithmetic and propagate existing curve errors
- [x] Wire and activate the proptest target (AC: 1, 4, 5)
  - [x] Add `proptest` as the `susu` dev-dependency
  - [x] Add `programs/susu/tests/no_strategic_default.rs` to include the audit-path invariant test
  - [x] Add the release-mode invariant command to the CI `lint-and-build` job
- [x] Validate performance, determinism, and failure quality (AC: 3, 6)
  - [x] Run `RUSTUP_TOOLCHAIN=stable cargo test --test no_strategic_default --release`
  - [x] Ensure the proptest config uses at least 10,000 cases
  - [x] Ensure assertion messages include `n`, `slot`, `contribution`, `decimals`, and `expected_payoff`

## Dev Notes

### Architecture Requirements

- `programs/susu/src/curve.rs` remains the single source of curve math.
- The payoff formula must be derived from the canonical curve:
  `payout = (n - 1) * contribution`, `paid_before_payout = slot * contribution`, `collateral = calculate_collateral(...)`, `expected_default_payoff = payout - paid_before_payout - collateral`.
- The current Story 3.1 curve comment states this result is `-n * contribution` for every valid slot. The implementation should compute through the canonical API rather than hard-code that simplification.
- The audit-facing invariant source path is `tests/invariants/no_strategic_default.rs`; Cargo should execute it through a package integration test target without moving the audit path.

### Testing Guidance

- Use the Rust `proptest!` macro, not a hand-written loop over deterministic examples.
- Sample `slot` from the generated `n` so invalid `slot >= n` cases are excluded from this invariant.
- Include both stable mint labels even though USDC and USDT currently share 6 decimals.
- Keep the release-mode command suitable for CI and the 180-second NFR-P4 budget.

### References

- GitHub issue: https://github.com/tantshirt/susu-monorepo/issues/44
- Epic 5 test design: `output_susu/test-artifacts/test-design/test-design-epic-5.md`
- Curve module: `programs/susu/src/curve.rs`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `node --test tests/atdd/story-5-1-no-strategic-default-proptest.static.red.test.mjs`
- `RUSTUP_TOOLCHAIN=stable cargo test -p susu expected_default_payoff`
- `RUSTUP_TOOLCHAIN=stable cargo test --test no_strategic_default --release`

### Completion Notes List

- Added canonical `expected_default_payoff` in `programs/susu/src/curve.rs`, deriving collateral through `calculate_collateral` and using checked signed arithmetic for payout, paid-before-payout, and collateral subtraction.
- Activated the audit-facing proptest through `programs/susu/tests/no_strategic_default.rs`; the property runs 10,000 generated cases across `n`, `slot`, contribution base units, and USDC/USDT 6-decimal labels with a fixed proptest RNG seed.
- Wired the release-mode invariant command into the CI `lint-and-build` job.
- Verified the release invariant completed successfully in 0.02 seconds on this machine.

### File List

- `.github/workflows/ci.yml`
- `Cargo.lock`
- `programs/susu/Cargo.toml`
- `programs/susu/src/curve.rs`
- `programs/susu/tests/no_strategic_default.rs`
- `tests/invariants/no_strategic_default.rs`
- `tests/atdd/story-5-1-no-strategic-default-proptest.atdd.md`
- `tests/atdd/story-5-1-no-strategic-default-proptest.static.red.test.mjs`
- `output_susu/implementation-artifacts/5-1-no-strategic-default-proptest.md`

### Change Log

- 2026-05-08: Story 5.1 — no-strategic-default proptest, canonical expected payoff helper, release-mode CI invariant gate.
