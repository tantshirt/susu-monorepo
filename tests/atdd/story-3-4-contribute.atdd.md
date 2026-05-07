---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-08'
storyId: '3.4'
storyKey: 3-4-contribute
storyFile: output_susu/implementation-artifacts/3-4-contribute.md
atddChecklistPath: tests/atdd/story-3-4-contribute.atdd.md
generatedTestFiles:
  - tests/atdd/story-3-4-contribute.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/3-4-contribute.md
  - programs/susu/src/instructions/contribute.rs
  - programs/susu/src/state/member_position.rs
  - programs/susu/src/state/group.rs
  - programs/susu/src/error.rs
  - programs/susu/idl/susu.json
  - _bmad/tea/config.yaml
---

# ATDD Checklist: Story 3.4 `contribute`

## Generation mode

AI generation — backend / Anchor-only. Browser recording does not apply.

## TDD red phase

Primary scaffold: `tests/atdd/story-3-4-contribute.static.red.test.mjs` (expects production sources and expanded IDL shapes that Story 3.4 implementation must satisfy).

## Acceptance criteria ↔ tests

| AC | Static red coverage |
| --- | --- |
| Active-only group status | `[P0] contribute validates Group lifecycle before moving tokens`; `GroupStatus::Active` + `GroupNotActive` error |
| Member + `MemberPosition` binding | `[P0] contribute account struct wires group, signer, vault, SPL token interfaces` |
| Slashed blocked | `[P0] contribute handler validates contribution rules before SPL CPI` uses `SlashStatus` + slashed error |
| Amount vs `contribution_amount` | contribution rule checks + amount mismatch error in `programs/susu/src/error.rs` |
| Rotation bounds + semantics | rotation_index checks + invalid rotation error |
| No duplicate per rotation | duplicate / already-recorded contribution error + `contribution_history` mutation |
| SPL transfer path | SPL tokens + CPI transfer markers in `contribute.rs` |
| ContributionRecord fields | ContributionRecord carries rotation + amount |

## Handoff for implementers

1. Expand `ContributionRecord` in `member_position.rs`; keep vec bound at 12 slots.
2. Add the `SusuError` variants required by static tests (canonical names enforced by regex).
3. Implement `instructions/contribute.rs` with full `Accounts` constraints (`GROUP_SEED`, `MEMBER_SEED`, `VAULT_SEED`), SPL `Transfer` CPI, and `msg!` suitable for observers.
4. Regenerate Codama outputs and frozen IDL per project policy once `susu.json` gains real account metadata for `contribute`.

## Validation

- `node --check tests/atdd/story-3-4-contribute.static.red.test.mjs`
- `node --test tests/atdd/story-3-4-contribute.static.red.test.mjs` — must fail RED until Story 3.4 implementation merges.
