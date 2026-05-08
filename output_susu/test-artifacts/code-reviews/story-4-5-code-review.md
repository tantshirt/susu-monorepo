# Story 4.5 Code Review

Date: 2026-05-08
Story: 4.5 double-claim guard

## Scope

- Branch diff from `origin/main...HEAD`
- `programs/susu/src/error.rs`
- `programs/susu/tests/claim_payout.rs`
- `tests/atdd/story-4-5-double-claim-guard.static.red.test.mjs`
- `docs/threat-model.md`
- IDL and generated SDK error surfaces

## Findings

1. Cursor Bugbot found two high-severity test-quality issues in `programs/susu/tests/claim_payout.rs`: a tautological vault-balance assertion and a receipt immutability test that only exercised `Clone`.

## Fixes Applied

- Replaced the tautological balance assertion with source-level checks proving receipt `init` is an account-validation constraint before handler transfer logic.
- Replaced the clone-based immutability test with assertions that `claim_payout` has no `init_if_needed` or `realloc` path that can route an existing receipt into handler mutation logic.
- Updated ATDD/static tests and threat-model wording to avoid claiming live token-transfer coverage where the repository currently has source-level Rust tests.

## Review Notes

- `claim_payout` still uses the canonical `RotationReceipt` PDA with Anchor `init`, so a duplicate claim attempts to initialize an already-existing account before reaching token CPI.
- No `claimed` boolean or group-level duplicate-claim flag was added, avoiding divergent payout state.
- `AlreadyClaimed` was added as a stable protocol error surface and propagated to the checked-in IDL plus generated TS/Rust SDK stubs.
- Documentation explicitly describes receipt existence as the canonical proof of payout and references the Story 4.5 regression tests.

## Result

- Code review passed after fixing the Cursor Bugbot findings.
