---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-05-07
storyId: "2.5"
storyKey: story-2.5-cancel-group
storyFile: output_susu/implementation-artifacts/2-5-cancel-group.md
atddChecklistPath: tests/atdd/story-2.5-cancel-group.atdd.md
generatedTestFiles:
  - tests/atdd/story-2.5-cancel-group.static.red.test.mjs
  - programs/susu/tests/cancel.rs
inputDocuments:
  - output_susu/implementation-artifacts/2-5-cancel-group.md
  - output_susu/implementation-artifacts/epic-2-test-design-2026-05-07.md
  - programs/susu/src/instructions/cancel_group.rs
  - programs/susu/src/state/group.rs
  - programs/susu/src/error.rs
redPhase: true
---

# ATDD Checklist: Story 2.5 cancel_group

## TDD Red Phase

Red-phase acceptance scaffolds are generated in:

- `tests/atdd/story-2.5-cancel-group.static.red.test.mjs`
- `programs/susu/tests/cancel.rs`

The repository does not yet have a committed LiteSVM transaction fixture that can load the compiled SBF program, submit signed Anchor instructions, mutate account bytes for `Active` and `Completed` setup, capture logs, or extract exact Anchor constraint errors. Runtime coverage is therefore represented by static and Rust proxy tests until that fixture exists.

## Acceptance Criteria Coverage

| AC / Requirement | Coverage | Test |
| --- | --- | --- |
| Creator cancels `Forming` group | Requires `CancelGroup` accounts over existing mutable `Group`, handler guard for `GroupStatus::Forming`, and `group.status = GroupStatus::Cancelled`. | `[P0] cancel_group validates Forming then persists Cancelled status` |
| Non-creator rejection | Requires `creator: Signer<'info>`, `has_one = creator`, and canonical Group PDA seeds. | `[P0] cancel_group account constraints enforce creator-only access` |
| Re-cancel rejection | Requires the same non-Forming guard to return `SusuError::GroupAlreadyStarted` for `Cancelled`. | `[P0] cancel_group rejects all non-Forming states with the selected error` |
| `Active` / `Completed` rejection | Static proxy pins the non-Forming guard; runtime fixture gap is documented until direct account mutation or `start_group` support exists. | `[P0] cancel_group rejects all non-Forming states with the selected error` |
| Status persistence | Requires direct assignment to `group.status` after validation and before success return. | `[P0] cancel_group validates Forming then persists Cancelled status` |
| `group_cancelled` log/event | Requires exact `msg!("group_cancelled group_pda={} creator={}", ...)`. | `[P1] cancel_group emits group_cancelled and remains metadata-only` |
| No token movement/custody/refund logic | Requires no token accounts, SPL token imports, transfers, CPI/invoke, vault/custody, fee, yield, or collateral/refund mutation. | `[P0] cancel_group has no token movement, custody, refund, fee, or yield logic` |
| IDL/public interface | Requires program and IDL accounts `creator`, `group`, with `group_id: u64`. | `[P0] cancel_group is wired into the Anchor program and IDL` |

## Step 3 Develop Handoff

1. Implement only Story 2.5 production code needed to satisfy these tests.
2. Use `programs/susu/src/instructions/cancel_group.rs` with `CancelGroup<'info>` accounts, `creator: Signer<'info>`, and mutable `Group` constrained by `has_one = creator` and `[GROUP_SEED, creator, group.group_id]`.
3. Keep the handler metadata-only: validate `Forming`, set `Cancelled`, and emit `group_cancelled`.
4. Return `SusuError::GroupAlreadyStarted` for every non-Forming status, including re-cancel.
5. Do not add token accounts, vault/custody/refund logic, collateral mutation, close/realloc, or SPL token CPI.
6. Replace static/proxy coverage with real LiteSVM instruction tests when the shared runtime fixture exists.

## Validation

- `node --check tests/atdd/story-2.5-cancel-group.static.red.test.mjs` should pass.
- `node --test tests/atdd/story-2.5-cancel-group.static.red.test.mjs` should fail before Story 2.5 implementation and pass after implementation.
- `cargo test -p susu --test cancel` should fail before Story 2.5 implementation and pass after implementation, or be replaced by runtime LiteSVM tests.

## Runtime Fixture Gap

LiteSVM remains the intended runtime layer for Story 2.5, but the repo currently lacks a shared runtime fixture with these capabilities: load the `susu` SBF artifact, fund creator and non-creator signers, create or seed Anchor-compatible `Group` accounts, submit real `cancel_group` transactions, decode post-transaction `Group.status`, mutate account bytes to `Active` and `Completed` for negative setup, capture `group_cancelled` logs, and expose exact Anchor constraint and `SusuError` failures. Until that fixture exists, these ATDD tests use source-level and Rust proxy assertions.
