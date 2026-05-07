# Story 3.4 — Implement `contribute` instruction

**Story ID:** 3.4  
**Story Key:** `3-4-contribute`  
**Epic:** 3 — Curve module, contributions & collateral lifecycle

## Goal

Implement the on-chain `contribute` instruction so an accepted member can transfer the group’s fixed `contribution_amount` of the group `mint` SPL token into the protocol’s vault for the current contribution period, with state updates on `MemberPosition` and appropriate validation and errors.

## Acceptance criteria

1. **Active group only** — Contributions are rejected unless `Group.status == GroupStatus::Active` (distinct error from Forming / Cancelled / Completed).
2. **Member identity** — The instruction is member-signed; `MemberPosition` must match the group PDA and `member_pubkey`; the member must appear as an accepted slot on `Group.members`.
3. **Slashed guard** — Members with `SlashStatus::Slashed` (or non-`None` per product rules) cannot contribute; use a dedicated `SusuError`.
4. **Fixed amount** — `amount` argument must equal `group.contribution_amount` (or documented checked math against it); wrong amount returns a dedicated `SusuError`.
5. **Rotation window** — `rotation_index` must be within `[0, group.n)` and must match the rotation period the protocol tracks for “this” contribution (until Epic 4 finalizes deterministic slots, document the placeholder rule in code comments and keep checks consistent with `Group` fields that exist after 3.4).
6. **No double pay** — The same member cannot record two contributions for the same `rotation_index` in `MemberPosition.contribution_history` (bounded vec); duplicate returns a dedicated `SusuError`.
7. **SPL movement** — Perform a checked SPL token transfer from the member’s source token account into the group vault token account for `group.mint`, using PDA-derived vault addresses (`VAULT_SEED` + group) and Anchor SPL constraints (no custody shortcuts, no fee/yield semantics).
8. **Contribution record shape** — `ContributionRecord` must carry at least `rotation_index` and `amount` so off-chain clients andStory 3.8+ gates can reason about participation history.
9. **IDL / clients** — Rebuild `programs/susu/idl/susu.json` so `contribute` lists all accounts required for client generation; Codama-generated clients stay in sync via existing codegen.

## Out of scope (explicit)

- Epic 4 deterministic rotation-slot assignment (may stay placeholder-compatible with `rotation_slot == u8::MAX`).
- Story 3.8 “all collateralized before contributions” gate (separate story will layer preconditions).

## Test / ATDD notes

- Red-phase static checks live under `tests/atdd/story-3-4-contribute.*`.
- Integration tests in `programs/susu/tests/` should be expanded during implementation once vault and token fixtures exist.
