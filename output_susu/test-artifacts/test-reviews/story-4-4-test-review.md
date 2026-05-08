# Story 4.4 Test Review

Date: 2026-05-08
Issue: #41
Scope: pre-deadline `claim_payout` guard ATDD/static tests, Rust guard tests, IDL/SDK/i18n parity evidence.

## Review Result

PASS after fixes.

## Findings

1. Initial Story 4.4 static test was too tightly coupled to handler-body source text and failed to observe the `ContributionPeriodOpen` error inside the extracted helper. Fixed by keeping ordering assertions on the handler and error-mapping assertions on the full claim source.
2. Existing Story 4.2 static test still looked for the prior `RotationNotClosed` handler token and helper-internal `NotRotationRecipient` ordering. Fixed to validate the current helper call order while preserving `RotationNotClosed` IDL compatibility.
3. IDL freeze evidence needed to move with the new public error surface. Fixed by updating `IDL_FREEZE.md`, `log/2026-05-08.md`, SDK error stubs, and `apps/reference/messages/en.json`.

## Coverage Evidence

- `tests/atdd/story-4-4-pre-deadline-guard.static.red.test.mjs` covers `ContributionPeriodOpen`, strict `>` semantics, no receipt/CPI before deadline rejection, checked math, and the Rust boundary matrix.
- `programs/susu/tests/claim_payout.rs` covers `deadline - 1`, `deadline`, and `deadline + 1` for `n in {3, 7, 10}` and rotations `0` and `n - 1`.

## Commands

- `node --test tests/atdd/story-4-4-pre-deadline-guard.static.red.test.mjs` - pass
- `cargo test -p susu --test claim_payout claim_payout_pre_deadline_guard -- --nocapture` - pass
- `cargo test -p susu --test claim_payout` - pass, 12 tests
- `pnpm test:atdd` - pass, 98 tests

## Residual Risk

No full clock-warp Anchor/LiteSVM fixture exists in this repository yet. Story 4.4 runtime timing evidence is covered by direct Rust helper tests plus static guard-order checks until that shared fixture exists.
