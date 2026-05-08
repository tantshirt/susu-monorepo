# Story 4.5 Test Review

Date: 2026-05-08
Story: 4.5 double-claim guard

## Scope

- `tests/atdd/story-4-5-double-claim-guard.atdd.md`
- `tests/atdd/story-4-5-double-claim-guard.static.red.test.mjs`
- `programs/susu/tests/claim_payout.rs`
- `docs/threat-model.md`
- `programs/susu/idl/susu.json`
- `sdk/ts/src/generated/errors/SusuError.ts`
- `sdk/rust/src/generated/errors.rs`

## Findings

1. The first implementation of the Story 4.5 Rust tests did not include `claim_payout` in the new test names, so `cargo test -p susu claim_payout` filtered them out.

## Fixes Applied

- Renamed the new Rust tests to include the `claim_payout` filter token.
- Confirmed `cargo test -p susu claim_payout` executes the three Story 4.5 tests plus the existing claim payout regression tests.
- Added ATDD coverage for `AlreadyClaimed`, structural receipt-PDA initialization, no runtime claimed boolean, per-rotation receipt isolation, no-second-transfer evidence, and threat-model documentation.

## Result

- Test review passed after fixes.

## Residual Risk

- This repository's current program test pattern is static/source-level plus pure Rust helpers rather than a live LiteSVM token-transfer harness. The Story 4.5 guard still relies on Anchor account validation for `init`-on-existing-PDA rejection, which CI exercises through build/IDL checks and source-level regression tests.
