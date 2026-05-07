---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-05-07
storyId: "2.6"
storyKey: story-2.6-state-query-helpers
storyFile: output_susu/implementation-artifacts/2-6-state-query-helpers.md
atddChecklistPath: tests/atdd/story-2.6-state-query-helpers.atdd.md
generatedTestFiles:
  - sdk/ts/package.json
  - sdk/ts/tests/queries.test.ts
  - tests/atdd/story-2.6-state-query-helpers.static.red.test.mjs
inputDocuments:
  - output_susu/implementation-artifacts/2-6-state-query-helpers.md
  - output_susu/implementation-artifacts/epic-2-test-design-2026-05-07.md
  - sdk/ts/src/generated/accounts/Group.ts
  - sdk/ts/src/generated/accounts/MemberPosition.ts
  - sdk/ts/src/generated/seeds.ts
  - sdk/ts/package.json
  - sdk/rust/src/generated/accounts.rs
  - sdk/rust/src/generated/seeds.rs
---

# ATDD Checklist: Story 2.6 state query helpers

## TDD Red Phase

Red-phase query-helper scaffolding is generated in:

- `sdk/ts/tests/queries.test.ts`
- `tests/atdd/story-2.6-state-query-helpers.static.red.test.mjs`

The TS unit scaffold is intentionally `describe.skip(...)` until the Story 2.6 implementation task activates it. The SDK package now has `pnpm test` wired to `vitest run`, but the active static red test fails on this ATDD branch because `sdk/ts/src/helpers/queries.ts`, `sdk/rust/src/queries.rs`, and their exports are not implemented yet.

## Generation Mode

AI generation, backend/static mode. Browser recording and live RPC are not applicable. Story 2.6 acceptance depends on SDK mock RPC tests and Rust parity tests, not devnet calls.

## Acceptance Criteria Coverage

| AC / Requirement | Coverage | Test |
| --- | --- | --- |
| `getGroup(groupPda)` decodes a typed `Group` | TS mock scaffold requires mocked encoded account data and a Codama-generated `Group` decoder. Static red test requires exported `getGroup` and decoder usage. | `getGroup returns decoded Group when account exists`; `[P0] TS query helpers expose...` |
| Missing group returns `undefined` | TS mock scaffold and static red test pin missing-account semantics to `undefined`, not `null` or not-found throws. | `getGroup returns undefined when account does not exist`; `[P0] TS missing-account semantics...` |
| `getGroupByCreator(creator, groupId)` derives Group PDA | TS mock scaffold requires derivation before account fetch. Static red test requires generated `GROUP_SEED` usage and forbids inline seed literals. | `getGroupByCreator derives the Group PDA...`; `[P0] TS query helpers expose...` |
| `getMemberPosition(groupPda, member)` decodes or returns `undefined` | TS mock scaffold requires decoded result and missing result. Static red test requires generated `MEMBER_SEED` and Codama MemberPosition decoder usage. | `getMemberPosition returns decoded MemberPosition...`; `[P0] TS query helpers expose...` |
| `queryParticipationHistory(wallet)` uses `getProgramAccounts` memcmp | TS mock scaffold requires a memcmp filter on `MemberPosition.member_pubkey` offset `40`. Static red test pins the same offset and participation record fields. | `queryParticipationHistory uses... offset 40`; `[P0] queryParticipationHistory uses...` |
| Codama-generated types and seed constants only | Static red test forbids hand-rolled Borsh, inline TS seed literals, app/indexer imports, direct `@solana/web3.js` v1 imports, and live RPC endpoints. | `[P0] TS query-helper mock RPC scaffold...`; `[P0] TS SDK exports...` |
| TS SDK export | Static red test requires `sdk/ts/src/index.ts` to re-export helper queries. | `[P0] TS SDK exports query helpers...` |
| `pnpm test` in `sdk/ts` | Static red test requires `sdk/ts/package.json` to expose `test: vitest run` and declare Vitest for the query unit tests. | `[P0] TS query-helper mock RPC scaffold...` |
| Rust SDK parity | Static red test requires `sdk/rust/src/queries.rs`, `Option<T>` semantics, generated seed constants, `ParticipationRecord`, no live RPC, and co-located `#[cfg(test)]` parity tests. | `[P0] Rust SDK records query-helper parity tests...` |

## Rust Helper Test Plan

The current Rust generated client surface on `main` is still placeholder-level: generated account structs are empty marker structs. Therefore this ATDD pass does not add Rust production helpers or pretend to decode account bytes. The implementation story must add either mock-RPC unit tests in `sdk/rust/src/queries.rs` or equivalent proxy tests once the final 2.4/2.5 account/IDL surface is committed.

Required Rust tests:

1. `get_group_returns_decoded_group_when_account_exists`
2. `get_group_returns_none_when_account_missing`
3. `get_group_by_creator_derives_group_pda_with_generated_seed`
4. `get_member_position_returns_decoded_position_or_none`
5. `query_participation_history_uses_member_pubkey_memcmp_offset_40`
6. `query_participation_history_maps_rotation_slot_contributions_slashed_completed`

## Step 3 Develop Handoff

1. Implement only Story 2.6 read-only SDK helpers after Stories 2.4 and 2.5 finalize their account and IDL surface.
2. Keep helpers in `sdk/ts/src/helpers/queries.ts` and re-export them from `sdk/ts/src/index.ts`.
3. Keep Rust parity in `sdk/rust/src/queries.rs` and re-export it from `sdk/rust/src/lib.rs`.
4. Use Codama-generated account decoders and generated PDA seed constants. Do not hand-roll Borsh, inline `Buffer.from("group")` or `Buffer.from("member")`, or import reference-app/indexer dependencies.
5. Activate `sdk/ts/tests/queries.test.ts` scenario by scenario during implementation. Each activated test should fail first, then pass after the helper behavior exists.
6. Replace or complement the static Rust parity red check with real Rust unit tests once the generated Rust client can decode the final account types.

## Validation

- `node --check tests/atdd/story-2.6-state-query-helpers.static.red.test.mjs` should pass.
- `node --test tests/atdd/story-2.6-state-query-helpers.static.red.test.mjs` should fail red before implementation because query helper files and exports do not exist.
- `pnpm --dir sdk/ts build` should still pass because ATDD TS tests are outside the SDK build include set and no production files were changed.

## Implementation Dependency

Story 2.6 implementation remains gated by the final Story 2.4 and 2.5 account/IDL surface. In particular, `MemberPosition` field shape, cancellation/completion status semantics, and generated decoder APIs must be stable before the query helpers are made green.
