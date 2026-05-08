# Story 4.4 ATDD: pre-deadline `claim_payout` guard

GitHub issue: #41

## Scenario 1: 4.4-INT-001 rejects one second before close

Given an `Active` group and a valid rotation recipient
And rotation `i` closes at `group.start_timestamp + (i + 1) * group.contribution_period`
When the recipient calls `claim_payout(group, i)` at `deadline - 1`
Then the instruction rejects with `SusuError::ContributionPeriodOpen`
And no receipt fields are written
And no vault transfer CPI is reached.

## Scenario 2: 4.4-INT-002 rejects exactly at close

Given the same valid recipient path
When the recipient calls `claim_payout(group, i)` at exactly `deadline`
Then the instruction still rejects with `SusuError::ContributionPeriodOpen`
And this proves the protocol uses strict `Clock.unix_timestamp > deadline` semantics.

## Scenario 3: 4.4-INT-003 allows one second after close

Given the same funded rotation
When the recipient calls `claim_payout(group, i)` at `deadline + 1`
Then the pre-deadline guard passes
And the successful path may initialize the `RotationReceipt` and transfer the payout.

## Scenario 4: 4.4-INT-004 covers multiple group sizes and boundary slots

Given `n in {3, 7, 10}`
And rotation `i` is either `0` or `n - 1`
When the guard is evaluated at `deadline - 1`, `deadline`, and `deadline + 1`
Then the first two timestamps reject with `ContributionPeriodOpen`
And the final timestamp succeeds.

## Scenario 5: 4.4-UNIT-005 uses checked deadline arithmetic

Given deadline calculation uses `start_timestamp`, `contribution_period`, and `rotation_index`
When arithmetic overflows
Then `SusuError::ArithmeticOverflow` is returned
And the implementation does not use saturating, wrapping, panic, or assert-based math.

## Static acceptance map

- `tests/atdd/story-4-4-pre-deadline-guard.static.red.test.mjs` requires the story-specific error name, IDL exposure, strict guard ordering, checked math, and Rust test coverage tokens.
- `programs/susu/tests/claim_payout.rs` should hold direct guard tests for the `n in {3,7,10}` and rotation `0`/`n-1` matrix until a full clock-warp integration fixture is available.

## Commands

- `pnpm test:atdd -- --test-name-pattern "Story 4.4|4.4"`
- `cargo test -p susu --test claim_payout claim_payout_pre_deadline_guard -- --nocapture`
