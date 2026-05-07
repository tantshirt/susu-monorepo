---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-05-07
storyId: "2.4"
storyKey: story-2.4-accept-invite
storyFile: output_susu/implementation-artifacts/2-4-accept-invite.md
atddChecklistPath: tests/atdd/story-2.4-accept-invite.atdd.md
generatedTestFiles:
  - tests/atdd/story-2.4-accept-invite.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/2-4-accept-invite.md
  - output_susu/implementation-artifacts/epic-2-test-design-2026-05-07.md
  - tests/atdd/story-2.3-invite-mechanism.atdd.md
  - programs/susu/src/instructions/accept_invite.rs
  - programs/susu/src/instructions/invite_members.rs
  - programs/susu/src/state/group.rs
  - programs/susu/src/state/member_position.rs
  - programs/susu/src/error.rs
---

# ATDD Checklist: Story 2.4 accept_invite

## TDD Red Phase

Red-phase static acceptance tests are generated in `tests/atdd/story-2.4-accept-invite.static.red.test.mjs`.

The current `accept_invite` source is still a Story 1 shell: it accepts a `group_id` argument, has only `group` and `member_position` accounts, does not initialize a member-paid `MemberPosition` PDA, does not scan `Group.members`, and does not flip `accepted`. These tests are intentionally active red tests, following the existing Story 2.1-2.3 ATDD pattern, so they fail before Step 3 development and guide the implementation.

## Generation Mode

AI generation, backend/static mode. Browser recording is not applicable for an Anchor instruction story.

LiteSVM remains the Epic 2 fallback. Surfpool is not used because no repo documentation proves it is ready for Epic 2 acceptance execution.

## Acceptance Criteria Coverage

| AC / Requirement | Coverage | Test |
| --- | --- | --- |
| Public `accept_invite()` surface | Requires `accept_invite(ctx)` and `handler(ctx)` with no `group_id` or other args, plus IDL args `[]`. | `[P0] accept_invite is exposed with the Story 2.4 no-argument public interface` |
| MemberPosition PDA seeds | Requires `MEMBER_SEED` from `seeds.rs` and `seeds = [MEMBER_SEED, group.key().as_ref(), member.key().as_ref()]`. | `[P0] accept_invite account constraints initialize the member-paid MemberPosition PDA` |
| Group PDA validation | Requires mutable `Group` account validated by `GROUP_SEED`, `group.creator`, `group.group_id`, and `group.bump`. | `[P0] accept_invite account constraints initialize the member-paid MemberPosition PDA` |
| Member pays rent | Requires `member: Signer<'info>`, `payer = member`, `system_program`, `space = 8 + MemberPosition::INIT_SPACE`, and no `payer = creator`. | `[P0] accept_invite account constraints initialize the member-paid MemberPosition PDA` |
| Invited-member acceptance | Requires linear scan over `group.members.iter_mut().find(...)` comparing `MemberSlot.pubkey` to `ctx.accounts.member.key()`. | `[P0] accept_invite flips only the invited signer slot...` |
| `accepted = true` flip | Requires mutation of only the matched member slot after rejection checks. | `[P0] accept_invite flips only the invited signer slot...` |
| MemberPosition initial state | Requires `group`, `member_pubkey`, `rotation_slot = u8::MAX`, `collateral_posted = 0`, empty `contribution_history`, and `SlashStatus::None`. | `[P0] accept_invite flips only the invited signer slot...` |
| Non-invited rejection | Requires `SusuError::MemberNotInvited` before accepted mutation. | `[P0] accept_invite flips only the invited signer slot...` |
| Double accept rejection | Requires `SusuError::AlreadyAccepted` when the handler reaches an already accepted slot, or Anchor `AccountAlreadyInitialized` from the `init` PDA collision. | `[P0] accept_invite rejects non-invited and double-accept paths...` |
| No group activation | Requires no `GroupStatus::Active` transition and no `group.status = ...` assignment in `accept_invite`. | `[P0] accept_invite rejects non-invited and double-accept paths...` |
| No custody / fees / yield / transfer / CPI | Requires the instruction source to omit token, vault, custody, fee, yield, transfer, CPI, and invoke terms. | `[P1] accept_invite emits member_accepted and stays free of custody...` |
| Audit log | Requires exact `msg!("member_accepted group_pda={} member={}", group.key(), ctx.accounts.member.key())`. | `[P1] accept_invite emits member_accepted and stays free of custody...` |
| Runtime/proxy coverage handoff | Requires Step 3 to add `programs/susu/tests/accept.rs` covering happy path, non-invited, double accept, member rent payer, no activation, and no token side effects. | `[P1] Story 2.4 runtime or proxy coverage is present for Step 3 development` |

## Step 3 Develop Handoff

1. Replace the shell implementation in `programs/susu/src/instructions/accept_invite.rs` with the Story 2.4 Accounts constraints and handler.
2. Change `programs/susu/src/lib.rs` so `accept_invite` takes only `ctx: Context<AcceptInvite>` and delegates to `handler(ctx)`.
3. Regenerate IDL and SDK artifacts so `accept_invite` exposes `group`, `member_position`, `member`, `system_program`, and no args.
4. Add `programs/susu/tests/accept.rs`. If true LiteSVM transaction execution is still unavailable, use focused Rust proxy tests matching the current `happy_path.rs` and `invite.rs` style, and keep the runtime fixture gap documented.
5. Keep the instruction metadata-only: no group activation, collateral, custody, fee, yield, token transfer, or CPI.
6. Run `node --test tests/atdd/story-2.4-accept-invite.static.red.test.mjs` first and confirm RED, then implement until it passes.

## Validation

- `node --check tests/atdd/story-2.4-accept-invite.static.red.test.mjs` should pass to validate syntax.
- `node --test tests/atdd/story-2.4-accept-invite.static.red.test.mjs` should fail on this ATDD branch because Story 2.4 production code and `programs/susu/tests/accept.rs` are not implemented yet.
- Existing Story 2.3 ATDD tests were run as a baseline and pass against updated `main`.
- After Step 3 development, `node --test tests/atdd/story-2.4-accept-invite.static.red.test.mjs` should pass.

## Runtime Fixture Gap

The repo still does not have a committed LiteSVM transaction fixture that can load the compiled SBF program, fund member signers, create/invite a real `Group`, derive and initialize `MemberPosition` through signed Anchor instructions, decode post-transaction `Group` and `MemberPosition` account data, capture `member_accepted` logs, inspect payer balance deltas for rent, or extract exact Anchor/Susu errors.

Because that fixture is missing, this ATDD output uses intentional static red tests and requires Step 3 to add either true LiteSVM coverage or Rust proxy tests in `programs/susu/tests/accept.rs`. The proxy must cover PDA seeds, invited-member acceptance, `accepted = true`, `rotation_slot = u8::MAX`, `MemberNotInvited`, double accept via `AlreadyAccepted` or `AccountAlreadyInitialized`, member rent payer semantics, no group activation, and no custody/fee/yield/transfer/CPI behavior.
