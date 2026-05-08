# Story 4.6 ATDD: E2E lifecycle test

## Acceptance Scope

Story 4.6 is the Epic 4 capstone. It proves the payout lifecycle is pull-based and scheduler-free across create, invite, accept, collateralize, start/assign, contribute, claim, complete, and withdraw. Surfpool remains the canonical external integration target, with the local PR gate using Rust/static fallback coverage until the Surfpool host is available.

## Scenario 1: 4.6-E2E-001 full five-member lifecycle

Given a five-member group is created with a supported mint
And all invitees accept and post enough collateral for their deterministic slots
When contributions start
Then every accepted member receives one realized `rotation_slot`
And every rotation is funded by all members
And the realized recipient for each slot claims `claim_payout(group, i)` after that rotation closes.

## Scenario 2: 4.6-E2E-002 terminal state has all receipts and no stranded funds

Given all five rotations have been claimed
When the group is completed
Then the five `RotationReceipt` PDAs exist at `[ROTATION_SEED, group, i.to_le_bytes()]`
And each receipt stores the realized slot recipient and `n * contribution_amount`
And collateral withdrawal leaves every `MemberPosition.collateral_posted == 0`
And the modeled vault balance is zero.

## Scenario 3: 4.6-E2E-003 no scheduler dependency

Given Epic 4 payouts are permissionless pull transactions
When the lifecycle test and payout/completion code are scanned
Then they contain no scheduler, keeper, cron, automation, executor, bot, Chainlink, or Clockwork dependency tokens.

## Scenario 4: 4.6-E2E-004 no hard-coded slot recipient assumptions

Given slot assignment is hash-ranked and deterministic but not roster-index ordered
When the lifecycle test claims each rotation
Then it derives the claimant from `MemberPosition.rotation_slot`
And it never assumes member index `0` owns slot `0` or hard-codes a fixed recipient order.

## Scenario 5: 4.6-E2E-005 duration budget

Given the local fallback lifecycle runs in-process
When the lifecycle test completes
Then it records elapsed time and asserts the capstone stays under 30 seconds on the local test host.

## Scenario 6: 4.6-DOC-006 FR20 coverage traceability

Given Story 4.6 is the FR20 no-scheduler capstone
When coverage documentation is inspected
Then `tests/coverage/threat-model.md` references Story 4.6, FR20, the full lifecycle test, and the no-scheduler static check.

## Scenario 7: 4.6-FALLBACK-007 Surfpool environment blocker

Given Surfpool is still documented as `LiteSVM-fallback`
When Story 4.6 local gates run
Then the fallback Rust/static coverage may pass the PR
But Surfpool acceptance remains explicitly environment-blocked until `docs/surfpool-status.md` is upgraded and the Surfpool transcript is recorded.

## Expected Artifacts

- `tests/atdd/story-4-6-e2e-lifecycle-test.static.red.test.mjs`
- `programs/susu/tests/full_lifecycle.rs`
- `programs/susu/src/instructions/complete_group.rs`
- `tests/coverage/threat-model.md`

## Commands

```bash
node --test tests/atdd/story-4-6-e2e-lifecycle-test.static.red.test.mjs
cargo test -p susu --test full_lifecycle -- --nocapture
cargo test -p susu --test claim_payout claim_payout -- --nocapture
```
