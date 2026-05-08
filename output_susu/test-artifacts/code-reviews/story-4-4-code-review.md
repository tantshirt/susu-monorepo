# Story 4.4 Code Review

Date: 2026-05-08
Issue: #41
Scope: `claim_payout` pre-deadline guard implementation and tests.

## Review Layers

- Blind Hunter: checked handler ordering, error surface, IDL/SDK compatibility, and rollback assumptions.
- Edge Case Hunter: checked deadline boundary semantics, underfunded still-open rotations, overflow behavior, first/final rotations, and prior Story 4.3/4.5 guard interactions.
- Acceptance Auditor: mapped issue #41 and Epic 4 risk E4-004 to tests and implementation.

## Findings

1. P1 fixed: `verify_rotation_funded` ran before the deadline guard, so an early claim on a still-open underfunded rotation could return `ContributionAmountMismatch` instead of Story 4.4's required `ContributionPeriodOpen`. Moved `assert_rotation_closed` before funding verification while preserving recipient validation before deadline checks.

## Fixes Applied

- Reordered `claim_payout` handler to execute recipient guard, strict deadline guard, then funding guard, then token CPI.
- Added ATDD/static and Rust source-order assertions that deadline rejection precedes funding checks, receipt writes, and CPI.

## Commands

- `node --test tests/atdd/story-4-4-pre-deadline-guard.static.red.test.mjs` - pass
- `cargo test -p susu --test claim_payout` - pass, 12 tests

## Residual Risk

The repository still lacks a full clock-warp Anchor/LiteSVM fixture. The guard is covered by direct Rust helper tests and source-order checks until that fixture exists.
