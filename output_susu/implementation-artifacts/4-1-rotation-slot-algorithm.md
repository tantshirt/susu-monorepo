# Story 4.1: Deterministic on-chain rotation-slot assignment algorithm

Status: done
Issue: #38
Merged: PR #157 on 2026-05-08

## Story

As a Susu protocol enforcer,
I want rotation slots assigned to members at group start using a deterministic, on-chain-reproducible algorithm,
so that no off-chain randomness or trusted oracle is required and any auditor can replay the assignment from chain state alone.

## Acceptance Criteria

1. When a `Group` PDA transitions from `Forming` to `Active`, the slot-assignment routine runs before activation.
2. Slots `[0..n)` are assigned deterministically using `sha256(group_pda || member_pubkey || slot_seed)` ranking.
3. Every supplied `MemberPosition.rotation_slot` is updated from `u8::MAX` placeholder, or verified if already equal to the same deterministic slot.
4. Re-running the algorithm with the same group state produces the same slot mapping byte-for-byte.
5. `docs/rotation-assignment.md` documents the algorithm and a worked example.
6. Tests verify determinism and that all `n` slots are assigned exactly once for supported group sizes.
7. A `slots_assigned` log is emitted with the group and member/slot pairs.

## Implementation Notes

- Added `programs/susu/src/rotation.rs` as the pure assignment module.
- Added `ROTATION_SLOT_SEED = b"rotation-slot-v1"` as the protocol domain separator.
- `start_contributions` now writes deterministic final slots into writable remaining `MemberPosition` accounts before setting `GroupStatus::Active`.
- `post_collateral` validates the member-supplied slot against the same deterministic preview but leaves the `u8::MAX` placeholder untouched until group start.
- No later Epic 4 payout/deadline/double-claim logic was implemented.

## Validation

- `node --test tests/atdd/story-4-1-rotation-slot-algorithm.static.red.test.mjs`
- `cargo test -p susu --test rotation_assignment`
- `cargo test -p susu --test start_contributions_rotation`

## Files

- `programs/susu/src/rotation.rs`
- `programs/susu/src/instructions/start_contributions.rs`
- `programs/susu/src/instructions/post_collateral.rs`
- `programs/susu/src/lib.rs`
- `programs/susu/src/seeds.rs`
- `programs/susu/Cargo.toml`
- `Cargo.lock`
- `programs/susu/tests/rotation_assignment.rs`
- `programs/susu/tests/start_contributions_rotation.rs`
- `tests/atdd/story-4-1-rotation-slot-algorithm.atdd.md`
- `tests/atdd/story-4-1-rotation-slot-algorithm.static.red.test.mjs`
- `docs/rotation-assignment.md`
