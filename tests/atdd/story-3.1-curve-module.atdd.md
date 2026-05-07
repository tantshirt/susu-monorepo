---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-05-08
storyId: "3.1"
storyKey: story-3.1-curve-module
storyFile: output_susu/implementation-artifacts/3-1-curve-module.md
atddChecklistPath: tests/atdd/story-3.1-curve-module.atdd.md
generatedTestFiles:
  - tests/atdd/story-3.1-curve-module.static.red.test.mjs
  - tests/fixtures/curve-golden.json
  - programs/susu/tests/curve.rs
inputDocuments:
  - output_susu/implementation-artifacts/3-1-curve-module.md
  - output_susu/implementation-artifacts/epic-3-test-design-2026-05-08.md
---

# ATDD Checklist: Story 3.1 curve module

## TDD Red Phase

Red-phase static acceptance tests live in `tests/atdd/story-3.1-curve-module.static.red.test.mjs`.

They assert the canonical `programs/susu/src/curve.rs` module, `SusuError` variants, `lib.rs` wiring, checked-only arithmetic, inline `#[cfg(test)]` golden coverage, and the shared `tests/fixtures/curve-golden.json` contract. The lightweight integration target `programs/susu/tests/curve.rs` exists so `cargo test -p susu --test curve` is addressable in CI; it only validates fixture presence until production goldens are asserted from `curve.rs`.

## Generation Mode

AI generation, backend/static mode. No browser or live RPC.

## Acceptance Criteria Coverage

| AC | Coverage | Test |
| --- | --- | --- |
| AC1 `calculate_collateral` public, single locus of curve math | Static checks require `pub fn calculate_collateral(slot: u8, n: u8, contribution: u64, decimals: u8) -> Result<u64, SusuError>` and forbid duplicate curve math patterns under `programs/susu/src/instructions/`. | `[P0] curve.rs exposes...`, `[P1] instruction handlers...` |
| AC2 checked arithmetic only | Static scan requires `checked_add` / `checked_mul` / `checked_sub` and forbids `saturating_*` / `wrapping_*` in `curve.rs`. | `[P0] curve.rs uses checked_*...` |
| AC3 `CurveOverflow` on overflow | Static check requires mapping `None` from checked ops to `SusuError::CurveOverflow` (e.g. `ok_or` / `and_then` pattern). | `[P0] curve.rs maps arithmetic None...` |
| AC4 O(n) closed-form, n ∈ [3, 12] | Static check requires `require!`-style validation for `n` and `slot < n` returning `InvalidCurveParams`, and forbids `for`/`while`/`loop` in non-test `curve.rs` source. | `[P0] curve.rs validates n and slot...`, `[P0] curve.rs avoids iterative...` |
| AC5 unit tests n ∈ {3,5,7,10,12}, USDC/USDT + decimals | Static check requires `#[cfg(test)] mod tests` and test name tokens covering each n and 6- vs 9-decimal cases. | `[P0] curve.rs #[cfg(test)]...` |
| AC6 doc sync (5.5) | Checklist / PR review (Story 5.5); ATDD notes formula must match future `docs/collateral-curve.md`. | Narrative in this file |
| AC7 `cargo test -p susu --test curve` &lt;1s | Fixture wiring test committed; performance is manual/CI class note in story. | `programs/susu/tests/curve.rs`, Validation section |

## Step 3 Develop Handoff

1. Add `programs/susu/src/curve.rs` with the closed-form `calculate_collateral` and inline golden tests; re-export via `pub mod curve;` in `lib.rs`.
2. Extend `error.rs` with `CurveOverflow` and `InvalidCurveParams`.
3. Replace `null` expected values in `tests/fixtures/curve-golden.json` with exact u64 goldens and consume them from `#[cfg(test)]` (and optionally the integration test) for cross-language parity.
4. Keep all curve arithmetic out of `instructions/*.rs` — call `crate::curve::calculate_collateral` only.

## Validation

- `node --check tests/atdd/story-3.1-curve-module.static.red.test.mjs` should pass.
- `node --test tests/atdd/story-3.1-curve-module.static.red.test.mjs` should fail on this ATDD branch until `curve.rs`, error variants, and module wiring exist and match the contract.
- `RUSTUP_TOOLCHAIN=stable cargo test -p susu --test curve` should pass on the ATDD branch (fixture smoke only) and gain golden assertions as implementation lands.

## Epic 3 Test Design Traceability

| Test ID | Static / test coverage |
| --- | --- |
| 3.1-UNIT-001 | Golden n/decimals cases in fixture + `#[cfg(test)]` names |
| 3.1-UNIT-002 | `InvalidCurveParams` bounds tests required in static scan |
| 3.1-UNIT-003 | `CurveOverflow` path + checked-only |
| 3.1-UNIT-004 | No `saturating_*` / `wrapping_*` in `curve.rs` |
| 3.1-UNIT-005 | `curve-golden.json` schema + case keys |
| 3.1-UNIT-006 | Human/CI perf note; `cargo test -p susu --test curve` wired |
