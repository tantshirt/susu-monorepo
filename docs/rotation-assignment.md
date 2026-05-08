# Rotation Assignment

Story 4.1 assigns payout rotation slots deterministically when a group starts. No oracle, scheduler, recent blockhash, timestamp, or client randomness participates in assignment.

## Algorithm

For every roster member, the protocol computes:

```text
rank = sha256(group_pda || member_pubkey || slot_seed)
```

Where:

- `group_pda` is the canonical on-chain `Group` PDA.
- `member_pubkey` is the member wallet stored in `Group.members`.
- `slot_seed` is the protocol constant `ROTATION_SLOT_SEED = b"rotation-slot-v1"`.

The program sorts members by ascending `rank`. If two ranks ever collide, it breaks the tie by ascending member pubkey bytes. The sorted index becomes the final rotation slot, so the first ranked member gets slot 0, the second gets slot 1, and so on through `n - 1`.

Because all inputs are committed on chain before `start_contributions`, anyone can replay the exact mapping byte-for-byte.

## Worked Example

For a 3-member group, suppose the SHA-256 ranks sort as follows:

| Sorted rank | Member label | Assigned slot |
| --- | --- | ---: |
| lowest | member B | slot 0 |
| middle | member A | slot 1 |
| highest | member C | slot 2 |

`start_contributions` writes these assignments into each `MemberPosition.rotation_slot` account before setting the group to `Active`. The instruction also emits `slots_assigned` log lines containing each member and slot pair.
