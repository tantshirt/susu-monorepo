---
storyId: "2.1"
storyKey: "2-1-account-types-errors"
storyFile: "output_susu/implementation-artifacts/2-1-account-types-errors.md"
atddChecklistPath: "tests/atdd/story-2.1-account-types-errors.atdd.md"
generatedTestFiles:
  - "tests/atdd/story-2.1-account-types-errors.static.red.test.mjs"
inputDocuments:
  - "output_susu/implementation-artifacts/2-1-account-types-errors.md"
  - "output_susu/implementation-artifacts/epic-2-test-design-2026-05-07.md"
  - "_bmad/tea/config.yaml"
redPhase: true
lastSaved: "2026-05-07"
---

# Story 2.1 ATDD Checklist

## Scope

Story 2.1 defines type and interface contracts only: `Group`, `MemberPosition`, `RotationReceipt`, canonical `SusuError`, English `errors.*` i18n keys, PDA seed-source discipline, bounded vector account sizing, and IDL freeze behavior.

## Acceptance Test Scaffolds

- `tests/atdd/story-2.1-account-types-errors.static.red.test.mjs`
  - `[P0] Group account locks the Story 2.1 state shape`
  - `[P0] MemberPosition account locks PDA-owned member state shape`
  - `[P0] RotationReceipt account is an existence-as-flag double-claim guard`
  - `[P0] Vec fields are bounded and source has no realloc attack surface`
  - `[P0] SusuError declares canonical variants with Anchor messages`
  - `[P1] English i18n messages cover every SusuError with recovery hints`
  - `[P1] PDA seed literals stay centralized in seeds.rs`
  - `[P0] IDL exposes Story 2.1 surface while retaining frozen hash behavior`

These are intentionally active red-phase tests. They should fail against the current placeholder production code and turn green only after Story 2.1 implementation updates the account types, error enum, i18n baseline, and regenerated IDL.

## Implementation Handoff

- Define `programs/susu/src/state/group.rs` with `Group`, `GroupStatus`, `MemberSlot`, `CurveParams`, `#[derive(InitSpace)]`, and `#[max_len(12)]` on `members`.
- Define `programs/susu/src/state/member_position.rs` with `MemberPosition`, `ContributionRecord`, `SlashStatus`, `#[derive(InitSpace)]`, `#[max_len(12)]` on `contribution_history`, and documentation for the `u8::MAX` rotation placeholder.
- Define `programs/susu/src/state/rotation_receipt.rs` without a `signature` field and with a documented `ROTATION_SEED` PDA source.
- Replace the placeholder `SusuError::Unimplemented` with the seven initial Anchor `#[error_code]` variants and `#[msg("...")]` strings.
- Add `apps/reference/messages/en.json` with `errors.GroupFull`, `errors.GroupAlreadyStarted`, `errors.MemberNotInvited`, `errors.InvalidMemberCount`, `errors.MintNotSupported`, `errors.GroupCancelled`, and `errors.AlreadyAccepted` recovery hints.
- Keep all PDA byte literals centralized in `programs/susu/src/seeds.rs`; import or document constants by name elsewhere.
- Regenerate IDL with `anchor build`, then run `scripts/check-idl-hash.sh`. If the Story 2.1 IDL surface is correct but the frozen hash mismatches, escalate the freeze discrepancy instead of silently updating `IDL_FREEZE.md`.

## Commands

```bash
export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"
node --test tests/atdd/story-2.1-account-types-errors.static.red.test.mjs
bash scripts/check-patterns.sh
bash scripts/check-idl-hash.sh
node scripts/check-i18n-parity.ts
RUSTFLAGS="-D warnings" cargo build -p susu
```

## Expected Red Reasons Before Development

- Placeholder state structs do not expose the required fields or `InitSpace`.
- `SusuError` still contains only `Unimplemented`.
- `apps/reference/messages/en.json` does not exist yet.
- IDL currently lacks the Story 2.1 accounts and error variants even though the frozen hash itself is present.
