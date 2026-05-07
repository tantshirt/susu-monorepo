---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-05-07
storyId: "2.3"
storyKey: story-2.3-invite-mechanism
storyFile: output_susu/implementation-artifacts/2-3-invite-mechanism.md
atddChecklistPath: tests/atdd/story-2.3-invite-mechanism.atdd.md
generatedTestFiles:
  - tests/atdd/story-2.3-invite-mechanism.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/2-3-invite-mechanism.md
  - output_susu/implementation-artifacts/epic-2-test-design-2026-05-07.md
  - programs/susu/src/instructions/create_group.rs
  - programs/susu/src/state/group.rs
  - programs/susu/src/error.rs
---

# ATDD Checklist: Story 2.3 invite_members

## TDD Red Phase

Red-phase static acceptance tests are generated in `tests/atdd/story-2.3-invite-mechanism.static.red.test.mjs`.

The repository still does not have a committed LiteSVM transaction fixture that can load the compiled SBF program, submit signed Anchor instructions, decode account state after runtime execution, mutate account bytes for non-Forming status setup, capture logs, or extract exact Anchor error codes. Per the Epic 2 design, Surfpool remains deferred and LiteSVM is the fallback. Until that fixture exists, Story 2.3 runtime coverage is intentionally represented by static red tests that should fail before implementation and guide the Step 3 development work.

## Generation Mode

AI generation, backend/static mode. Browser recording is not applicable for an Anchor instruction story.

## Acceptance Criteria Coverage

| AC / Requirement | Coverage | Test |
| --- | --- | --- |
| Creator-only roster population | Requires `InviteMembers` Accounts with creator signer, mutable Group account, `has_one = creator`, and canonical Group PDA seeds using `GROUP_SEED`. | `[P0] invite_members account constraints enforce creator-only access...` |
| Exact invite count equals `Group.n` | Requires `require!(invitees.len() == group.n as usize, SusuError::InvalidMemberCount)`. | `[P0] invite_members validates Forming status and exact count before mutation` |
| No partial invites / no partial mutation on invalid input | Requires all validation to appear before `group.members = ...`; rejects push/extend/append style partial construction. | `[P0] invite_members validates Forming status and exact count before mutation` |
| Forming-only guard | Requires `GroupStatus::Forming` equality check and `SusuError::GroupAlreadyStarted`. | `[P0] invite_members validates Forming status and exact count before mutation` |
| Writes `MemberSlot` entries into `Group.members` | Requires input-order `invitees.into_iter().map(...)` into `MemberSlot { pubkey, accepted: false }` and assignment to `group.members`. | `[P0] invite_members writes ordered MemberSlot roster entries...` |
| Duplicate invitees | Story contract explicitly does not reject duplicate pubkeys in Story 2.3; duplicate consequences are deferred to Story 2.4 `MemberPosition` PDA collision. Static tests prevent accidental duplicate-validation scope creep. | `[P1] invite_members keeps duplicate-pubkey policy scoped to Story 2.4` |
| No separate Invite PDA/server | Requires no `Invite` account/PDA state, no `MemberPosition` creation, no account init/realloc/system program path, and architecture ADR. | `[P0] invite_members avoids separate Invite PDA...` |
| Public queryability | Requires ADR text documenting `Group.members` as the public `getAccountInfo` query surface. | `[P0] invite_members avoids separate Invite PDA...` |
| `members_invited` log/event | Requires exact `msg!("members_invited group_pda={} count={}", ...)` contract. | `[P1] invite_members emits members_invited and remains metadata-only` |
| No token movement/custody/fees/yield/transfer/CPI | Requires the invite instruction source to omit token, vault, fee, yield, transfer, CPI, and invoke terms. | `[P1] invite_members emits members_invited and remains metadata-only` |
| IDL/public interface | Requires `invite_members` in `lib.rs` and IDL with `creator`, `group`, and `invitees: Vec<pubkey>`. | `[P0] invite_members is wired into the Anchor program and IDL` |

## Step 3 Develop Handoff

1. Implement only Story 2.3 production code needed to satisfy these tests.
2. Add `programs/susu/src/instructions/invite_members.rs`, wire it through `instructions/mod.rs` and `lib.rs`, and regenerate IDL.
3. Keep invites in `Group.members`; do not introduce an Invite PDA, server dependency, token account, custody path, fee, yield, transfer, or CPI.
4. Add `docs/architecture-notes.md` with `ADR-001: Invite via Group roster, not separate Invite PDA`.
5. Add or replace these static tests with LiteSVM runtime tests once the shared runtime fixture exists. Required fixture capabilities: program loader, funded creator/non-creator signers, create-group setup, signed `invite_members` transaction construction, account decode for `Group.members`, direct Group status mutation for non-Forming rejection, log capture, and exact error extraction.
6. Keep Surfpool out of the Epic 2 critical path until repo docs prove it is ready.

## Validation

- `node --test tests/atdd/story-2.3-invite-mechanism.static.red.test.mjs` should fail on the ATDD branch because `invite_members` is not implemented yet.
- `node --check tests/atdd/story-2.3-invite-mechanism.static.red.test.mjs` should pass to validate test syntax.
- After Step 3 development, `node --test tests/atdd/story-2.3-invite-mechanism.static.red.test.mjs` should pass.

## Runtime Fixture Gap

LiteSVM is the intended runtime layer for Story 2.3, but the repo currently has only compile/unit proxy coverage in `programs/susu/tests/happy_path.rs`. That proxy does not execute Anchor instructions as transactions, does not capture runtime logs, and cannot prove account mutation atomicity through the Solana runtime. This ATDD output records the gap explicitly so Step 3 can either introduce the runtime fixture or keep these static red tests as the acceptance proxy with a documented waiver.
