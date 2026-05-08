# Story 4.6 Test Review

Date: 2026-05-08
Scope: ATDD static checks, `programs/susu/tests/full_lifecycle.rs`, receipt-verified `complete_group` transition, IDL/codegen parity.

## Findings

1. The first lifecycle fallback covered successful completion with all receipts but did not directly assert that `complete_group` rejects incomplete or malformed receipt lists.

## Fixes Applied

- Added `complete_group_rejects_missing_or_malformed_receipts` to `programs/susu/tests/full_lifecycle.rs`.
- The new test verifies missing receipt count rejection, bad receipt amount rejection, unchanged `Active` status after failures, and successful completion with canonical receipts.

## Evidence

- `cargo test -p susu --test full_lifecycle -- --nocapture` - pass, 2 tests.
- `pnpm test:atdd` - pass, 104 tests before the review fix; rerun required after committing review fix.

## Result

Pass after fix. No remaining actionable test-quality findings.
