# ATDD Checklist: Story 4.1 rotation-slot algorithm

## TDD Red Phase

Story source: GitHub issue #38, `output_susu/implementation-artifacts/dependency-graph.md`, and `output_susu/implementation-artifacts/epic-4-test-design-2026-05-08.md`.

The red phase introduces executable checks before implementation:

- `programs/susu/tests/rotation_assignment.rs` expects a pure rotation assignment module that computes a reproducible hash-rank bijection from `(group_pda, member_pubkey, slot_seed)`.
- `tests/atdd/story-4-1-rotation-slot-algorithm.static.red.test.mjs` expects the implementation module, start transition wiring, the `slots_assigned` log contract, and documentation at `docs/rotation-assignment.md`.

## Acceptance Criteria Coverage

| Acceptance criterion | Red test coverage | Risk link |
| --- | --- | --- |
| Group transitions from `Forming` to `Active` fires slot assignment | Static check requires `start_contributions.rs` to call `assign_rotation_slots_for_start` before `group.status = GroupStatus::Active`. | E4-001 |
| Slots `[0..n)` assigned deterministically by `sha256(group_pda || member_pubkey || slot_seed)` ranking | Rust tests require `calculate_rotation_assignments` determinism, group-domain separation, and bijection over `n in {3,5,7,10,12}`; static check requires SHA-256 and canonical input order. | E4-001 |
| Every `MemberPosition.rotation_slot` moves from `u8::MAX` placeholder to final slot | Static check requires mutable remaining-account serialization and `rotation_slot = assignment.slot`. | E4-001 |
| Re-running from identical state produces byte-identical mapping | Rust test calls the pure helper twice and compares exact assignment vectors. | E4-001 |
| Algorithm documented with worked examples | Static check requires `docs/rotation-assignment.md` to contain the formula and a worked example. | E4-012 |
| Tests verify determinism and one unique slot per member | Rust tests cover supported `n` matrix and no duplicate/gap invariant. | E4-001 |
| `slots_assigned` `msg!` event lists `(member, slot)` pairs | Static check requires the log token and the member/slot formatting tokens in `start_contributions.rs`. | E4-011 |

## Handoff for Step 3 Develop

1. Add `programs/susu/src/rotation.rs` as the single source of truth for assignment ranking.
2. Add a public pure helper with this contract: `calculate_rotation_assignments(group: Pubkey, members: &[Pubkey]) -> Result<Vec<RotationAssignment>>`.
3. Use `anchor_lang::solana_program::hash::hashv` / SHA-256 over `[group.as_ref(), member.as_ref(), ROTATION_SLOT_SEED]`; do not read clocks, recent blockhashes, env, RNG, or client randomness.
4. Sort by `(hash_bytes, member_pubkey_bytes)` and assign slot by sorted index.
5. Wire `start_contributions` to deserialize each remaining `MemberPosition`, assign final slots, serialize back to the writable account data, then run the all-collateralized gate against final slots before setting `GroupStatus::Active`.
6. Emit `slots_assigned` with group and each `(member, slot)` pair.
7. Document the algorithm and a worked example in `docs/rotation-assignment.md`.

## Validation Commands

```bash
node --test tests/atdd/story-4-1-rotation-slot-algorithm.static.red.test.mjs
cargo test -p susu --test rotation_assignment
```
