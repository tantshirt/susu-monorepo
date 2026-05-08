# Story 4.2 Test Review

Date: 2026-05-08
Story: 4.2 `claim_payout`

## Scope

- `tests/atdd/story-4-2-claim-payout.static.red.test.mjs`
- `programs/susu/tests/claim_payout.rs`
- `programs/susu/idl/susu.json`
- `scripts/check-idl-hash.sh`
- `scripts/check-sdk-parity.sh`

## Findings

1. IDL regression coverage was missing for the expanded `claim_payout` account surface and newly added payout errors.

## Fixes Applied

- Added a static IDL assertion that `claim_payout` exposes the expected account list.
- Added static IDL assertions for `ArithmeticOverflow`, `NotRotationRecipient`, and `RotationNotClosed`.

## Residual Risk

- The repository currently uses static and pure Rust tests for program behavior; no LiteSVM or full Anchor token-transfer integration harness is present in this branch.

