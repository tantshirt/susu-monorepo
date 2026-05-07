---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-05-08
storyId: "3.5"
storyKey: story-3-5-top-up-collateral
storyFile: output_susu/implementation-artifacts/3-5-top-up-collateral.md
atddChecklistPath: tests/atdd/story-3-5-top-up-collateral.atdd.md
generatedTestFiles:
  - programs/susu/tests/top_up_collateral.ts
  - tests/atdd/story-3-5-top-up-collateral.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/3-5-top-up-collateral.md
  - output_susu/implementation-artifacts/epic-3-test-design-2026-05-08.md
  - programs/susu/src/instructions/top_up_collateral.rs
  - programs/susu/src/state/member_position.rs
  - programs/susu/src/error.rs
  - programs/susu/src/seeds.rs
  - programs/susu/idl/susu.json
---

# ATDD Checklist: Story 3.5 — `top_up_collateral`

## TDD Red Phase

Red-phase scaffolds live in:

- `programs/susu/tests/top_up_collateral.ts` — `describe.skip` integration placeholders for 3.5-INT-001..003 until Anchor/LiteSVM + Story 3.1 curve land.
- `tests/atdd/story-3-5-top-up-collateral.static.red.test.mjs` — static expectations for Rust instruction semantics, vault seed discipline, Susu error variants, and `pub mod curve`.

`node --test tests/atdd/story-3-5-top-up-collateral.static.red.test.mjs` is expected to fail until `top_up_collateral.rs`, `error.rs`, and `curve.rs`/`lib.rs` meet the pinned acceptance shapes.

## Generation Mode

AI generation, backend/static. No browser recording; dropout is simulated via test fixtures (`group.n` mutation) until Epic 4 dropout instruction exists.

## Acceptance Criteria Coverage

| AC | Coverage | Artefact |
| --- | --- | --- |
| Recompute via `calculate_collateral` for post-dropout `group.n` | Static red requires handler to call `crate::curve::calculate_collateral`; INT-001 scaffold | `[P0] top_up_collateral instruction implements...`; TS `[3.5-INT-001]` |
| `collateral_posted + additional_amount >= new_required` (checked math) | `checked_add`, `CurveOverflow` | static red `[P0] top_up_collateral instruction...` |
| Else `InsufficientCollateral` | Variant on `SusuError` + handler wiring | static red error + Rust handler |
| SPL transfer vault credit | CPI `transfer`/`Transfer` markers | static red `[P0] top_up_collateral instruction...` |
| Update `MemberPosition.collateral_posted` | Source contains `collateral_posted` + checked add pathway | same |
| Anchor tests dropout + slash interaction | Skipped ITS with INT-003 narrative | TS file |
| `collateral_topped_up` msg | `msg!`/`collateral_topped_up` substring in ix | static red |

## Implement Handoff

1. Implement `curve::calculate_collateral` under Story 3.1; keep `crate::curve::calculate_collateral` as the only collateral requirement source inside `top_up_collateral`.
2. Extend `#[derive(Accounts)]` per story: signer member, ATA, vault PDA with `VAULT_SEED`, mint match, token program validation.
3. Add `InsufficientCollateral` and `CurveOverflow` to `programs/susu/src/error.rs`; map overflow from `checked_add` to `CurveOverflow`.
4. Enable `programs/susu/tests/top_up_collateral.ts` suite after LiteSVM/bankrun wiring; scrape or assert logs for `collateral_topped_up` secondary to vault balance + PDAs state.
5. Regenerate IDL + clients after account shape stabilizes (`anchor build`/Codama freeze per FR28–30).

## Validation

- `node --check tests/atdd/story-3-5-top-up-collateral.static.red.test.mjs` → pass syntax.
- Static node test suite → fails red until production files satisfy matchers.
