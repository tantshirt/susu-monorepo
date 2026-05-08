# Threat Model Notes

## Double-Claim Defense

`RotationReceipt[i]` is the canonical on-chain proof that rotation `i` has been paid for a group. The receipt PDA is derived from `ROTATION_SEED`, the group PDA, and `rotation_index.to_le_bytes()`, so each group rotation has exactly one possible receipt account.

`claim_payout` uses the Anchor `init` constraint on that receipt PDA. A first valid claim creates the receipt before recording payout metadata. A second claim for the same group and rotation tries to initialize an already-existing PDA and fails during account validation, before the handler reaches the `transfer_checked` vault CPI. This keeps the guard structural instead of relying on a runtime boolean in `Group` or `MemberPosition` that could drift from receipt state.

The Story 4.5 regression coverage lives in `programs/susu/tests/claim_payout.rs` and `tests/atdd/story-4-5-double-claim-guard.static.red.test.mjs`. Those tests lock the no-second-transfer expectation, receipt field immutability after duplicate rejection, and per-rotation PDA isolation.
