# Story 4.5 ATDD: double-claim guard

## Scenario 1: Same recipient cannot claim the same rotation twice

Given an Active group has completed and funded rotation `0`
And the recipient successfully calls `claim_payout(group, 0)` once
And the first call initializes `RotationReceipt[0]` at `[ROTATION_SEED, group_pda, 0.to_le_bytes()]`
When the same recipient submits `claim_payout(group, 0)` again with the same receipt PDA
Then the second call fails before the vault transfer path
And the failure is represented by `SusuError::AlreadyClaimed` or the documented Anchor init-on-existing-account mapping
And the vault balance remains equal to the post-first-claim balance.

## Scenario 2: Receipt contents are immutable after a failed duplicate claim

Given `RotationReceipt[0]` exists from the first successful claim
When a duplicate claim attempt fails
Then `RotationReceipt[0]` still stores the first claim's `group`, `rotation_index`, `recipient`, `amount`, `claimed_at`, and `bump`
And the implementation does not overwrite or mutate the receipt on rejection.

## Scenario 3: Double-claim protection is scoped per rotation

Given rotation `0` has been claimed and `RotationReceipt[0]` exists
When the valid recipient for rotation `1` claims `claim_payout(group, 1)` after rotation `1` is funded and closed
Then the rotation `1` claim succeeds
And `RotationReceipt[1]` is derived from the same seed set with `1.to_le_bytes()`
And `RotationReceipt[0]` and `RotationReceipt[1]` are distinct PDA accounts.

## Scenario 4: Different signer cannot bypass the receipt backstop

Given rotation `0` has already been claimed
When a different member tries to claim rotation `0`
Then signer/recipient validation rejects the request before any transfer
And the receipt PDA existence remains a structural backstop against any duplicate payout.

## Static acceptance map

| Acceptance target | Required evidence |
| --- | --- |
| `SusuError::AlreadyClaimed` exists | `programs/susu/src/error.rs` and checked-in IDL expose `AlreadyClaimed` with a stable message. |
| Structural guard uses receipt PDA existence | `ClaimPayout.rotation_receipt` keeps Anchor `init` with `ROTATION_SEED`, `group.key()`, and `rotation_index.to_le_bytes()`. |
| No runtime divergence flag | `Group`, `MemberPosition`, and `RotationReceipt` do not add `claimed`/`has_claimed` booleans. |
| Guard runs before CPI | Receipt validation is account-validation time via `init`; source tests also assert guard/error tokens occur before `transfer_checked`. |
| Per-rotation isolation | Program tests derive receipt PDAs for at least two rotation indices and assert they differ. |
| Receipt immutability on duplicate failure | Program tests verify receipt initialization happens during account validation, before handler transfer logic, and that no `init_if_needed`/`realloc` path can mutate an existing receipt. |
| Documentation | `docs/threat-model.md` includes a "Double-claim defense" section referencing `programs/susu/tests/claim_payout.rs` and `tests/atdd/story-4-5-double-claim-guard.static.red.test.mjs`. |

## Commands

```bash
node --test tests/atdd/story-4-5-double-claim-guard.static.red.test.mjs
cargo test -p susu claim_payout
```
