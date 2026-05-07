# Story 3.1: Implement closed-form O(n) dynamic-collateral curve module

Status: review

## Story

As a Susu program developer,
I want `programs/susu/src/curve.rs` with the closed-form O(n) curve formula computing `required_collateral(rotation_slot, n, contribution_amount, mint_decimals)`,
so that every contribution and claim instruction can call into one canonical implementation and the property test in Epic 5 has a single function to validate.

## Acceptance Criteria

1. **Given** the program from Epic 2, **when** `curve.rs` is committed with `calculate_collateral(slot: u8, n: u8, contribution: u64, decimals: u8) -> Result<u64, SusuError>`, **then** the function is `pub` and is the only place curve math exists in the entire repo.
2. All arithmetic uses `checked_add` / `checked_mul` / `checked_sub` (no `saturating_*`; `cargo deny` ruleset enforces).
3. The function returns `SusuError::CurveOverflow` on any arithmetic overflow.
4. Computational complexity is provably O(n); n is bounded ∈ [3, 12].
5. Unit tests in `#[cfg(test)] mod tests` cover known-input/known-output cases for n ∈ {3, 5, 7, 10, 12}, contribution = $50 USDC and $50 USDT (different decimals).
6. The documented formula matches the formula referenced in `docs/collateral-curve.md` (Story 5.5) — the doc and code are kept in sync via PR review.
7. `cargo test -p susu --test curve` runs in <1s.

## Tasks / Subtasks

- [x] Create `programs/susu/src/curve.rs` (AC: 1, 4)
  - [x] Define `pub fn calculate_collateral(slot: u8, n: u8, contribution: u64, decimals: u8) -> Result<u64, SusuError>`
  - [x] Implement closed-form O(n) formula (no loops over members; constant-time arithmetic given fixed-shape inputs)
  - [x] Validate `n` is in `[3, 12]` and `slot < n`; return `SusuError::InvalidCurveParams` otherwise
- [x] Wire checked arithmetic everywhere (AC: 2, 3)
  - [x] Use `checked_add` / `checked_mul` / `checked_sub` for every operation
  - [x] Map `None` overflow returns to `SusuError::CurveOverflow`
- [x] Register module in `programs/susu/src/lib.rs` (AC: 1)
  - [x] `pub mod curve;`
- [x] Add `SusuError::CurveOverflow` and `SusuError::InvalidCurveParams` to `error.rs` (AC: 3)
- [x] Author golden-test table (AC: 5, 7)
  - [x] `#[cfg(test)] mod tests` with table-driven cases for n ∈ {3, 5, 7, 10, 12}
  - [x] $50 USDC (6 decimals) and $50 USDT (6 decimals — but parameterize for future-proofing different-decimal mints)
  - [x] Assert exact `u64` equality vs hand-computed expected values
  - [x] Commit the table values to a JSON fixture at `tests/fixtures/curve-golden.json` for cross-language parity (consumed by `sdk/ts/tests/curve.test.ts` in Story 5.x)
- [x] Validate runtime budget (AC: 7)
  - [x] `cargo test -p susu curve` finishes in <1s on dev hardware

## Dev Notes

### Architecture compliance (non-negotiables)

- **Single source of truth.** `curve.rs` is the *only* place curve math exists in the program. All instructions (`post_collateral`, `top_up_collateral`, `slash_member`, the all-collateralized gate) call into this one function. Do not inline any curve arithmetic in `instructions/*.rs`.
- **Closed-form O(n).** The formula must not loop over members. Compute via the closed-form expression documented in `docs/collateral-curve.md`. Loops are forbidden for gas + auditability reasons (architecture §"Core Architectural Decisions" — dynamic-collateral curve).
- **Checked arithmetic only.** No `saturating_*`, no `wrapping_*`, no unchecked `+`/`-`/`*`. Every operation must use `checked_*` and propagate `None` to `SusuError::CurveOverflow`. CI enforces via `cargo deny` ruleset (Story 1.4).
- **Parity with TS SDK.** `sdk/ts/src/helpers/curve.ts` will mirror this function in Epic 5. The golden-test fixture (`tests/fixtures/curve-golden.json`) is the parity contract — Rust and TS both consume it.
- **Decimal-aware.** The function must accept `mint_decimals` so it works for USDC (6) and USDT (6) today, and any future SPL Token-2022 mint with different decimals.

### Source tree (created by this story)

```
programs/susu/src/
├── curve.rs                         # NEW — closed-form curve, golden tests inline
├── lib.rs                           # MODIFIED — `pub mod curve;`
└── error.rs                         # MODIFIED — adds CurveOverflow, InvalidCurveParams

tests/
└── fixtures/
    └── curve-golden.json            # NEW — golden table for cross-language parity
```

### Project Structure Notes

- This story lands the **module only**. Wiring into `post_collateral` happens in Story 3.2; into `top_up_collateral` in 3.5; into `slash_member` in 3.6; into the all-collateralized gate in 3.8.
- The `docs/collateral-curve.md` write-up is **deferred to Story 5.5**. This story commits the formula in code; the doc lands in Epic 5. The PR review checklist is the sync mechanism.
- Property-based testing (proptest) and adversary simulation are **deferred to Epic 5** (Stories 5.1–5.4). This story only commits inline `#[cfg(test)]` golden tests.
- `n ∈ [3, 12]` bound is hard-coded here; the same bound is enforced again in `create_group` (Story 2.2). Both must agree.

### Forbidden patterns

- No `b"..."` seed literals — this module touches no PDAs (curve is pure math).
- No floating-point arithmetic — `f32`/`f64` are forbidden in on-chain code (architecture §"Implementation Patterns & Consistency Rules").
- No `panic!`, `unwrap()`, or `expect()` outside `#[cfg(test)]` — every error path returns `Result`.
- No loops iterating over members or rotation slots — closed-form means closed-form.

### Testing standards

- Inline `#[cfg(test)] mod tests` with table-driven golden cases. Each case asserts exact `u64` equality.
- Cases must include: edge n (3 and 12), middle n (5, 7, 10), first slot (slot=0), last slot (slot=n-1), and middle slots.
- Two contribution amounts at minimum: $50 USDC (50_000_000 base units, 6 decimals) and $50 USDT (50_000_000 base units, 6 decimals). Add a synthetic 9-decimal case to verify decimal-handling.
- `cargo test -p susu curve` must complete in <1s.
- Cross-language parity (Rust ↔ TS) is exercised by Story 5.x via the JSON fixture; this story commits the fixture.

### References

- [epics.md §Epic 3 / Story 3.1](output_susu/planning-artifacts/epics.md) — full BDD ACs
- [architecture.md §Core Architectural Decisions](output_susu/planning-artifacts/architecture.md) — dynamic-collateral curve rationale (closed-form O(n), gas + auditability)
- [architecture.md §Implementation Patterns & Consistency Rules](output_susu/planning-artifacts/architecture.md) — checked-arithmetic-only rule, no floating-point
- [prd.md §Functional Requirements / FR9](output_susu/planning-artifacts/prd.md) — curve-module requirement
- [prd.md §Non-Functional Requirements / NFR-P1, NFR-P3, NFR-P4](output_susu/planning-artifacts/prd.md) — performance + auditability budgets

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

- Rust 1.79 toolchain could not parse current crates.io manifests (edition2024); `rust-toolchain.toml` updated to `stable` for resolution with Anchor 1.0.x / Solana dependency graph.

### Completion Notes List

- Implemented `calculate_collateral`: `contribution * (2*n - 1 - slot)` with checked multiplication; `InvalidCurveParams` for `n ∉ [3,12]` or `slot >= n`; `CurveOverflow` on overflow.
- Filled `tests/fixtures/curve-golden.json`; integration test parses fixture without extra dev-dependencies (std-only field extraction).
- Full `cargo test -p susu` passes.

### File List

- `programs/susu/src/curve.rs`
- `programs/susu/src/lib.rs`
- `programs/susu/src/error.rs`
- `programs/susu/tests/curve.rs`
- `tests/fixtures/curve-golden.json`
- `rust-toolchain.toml`
- `Cargo.lock`

### Change Log

- 2026-05-08: Story 3.1 curve module + golden fixture + toolchain alignment for current crates.io.
