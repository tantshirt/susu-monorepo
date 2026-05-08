# Story 4.2: Implement `claim_payout` instruction

Status: review
Issue: #39

## Story

As a Group Member designated as recipient of rotation `i`,
I want a `claim_payout(group, rotation_index)` instruction that transfers the rotation payout from the vault to my token account,
so that I can collect my pot after my rotation contribution period closes without scheduler or keeper infrastructure.

## Acceptance Criteria

1. `claim_payout(group, rotation_index)` validates `group_id` and requires the group to be `Active`.
2. The signer must own the supplied `MemberPosition`, and `MemberPosition.rotation_slot == rotation_index`.
3. The instruction uses Solana `Clock` and allows payout only when `now > rotation_start + contribution_period`.
4. A `RotationReceipt` PDA at `[ROTATION_SEED, group_pda, rotation_index.to_le_bytes()]` is initialized as the one-shot proof.
5. The receipt stores `group`, `rotation_index`, `recipient`, `amount`, `claimed_at`, and `bump`.
6. The payout amount is exactly `group.n * group.contribution_amount` using checked arithmetic.
7. SPL Token `transfer_checked` moves the payout from the group vault PDA to the recipient token account, signed by the group PDA.
8. A `payout_claimed` log is emitted with group, rotation index, recipient, and amount.

## ATDD Coverage

- `tests/atdd/story-4-2-claim-payout.atdd.md`
- `tests/atdd/story-4-2-claim-payout.static.red.test.mjs`
- `programs/susu/tests/claim_payout.rs`

## Implementation Notes

- `claim_payout` initializes `RotationReceipt` with canonical rotation PDA seeds.
- Vault transfer uses `transfer_checked` with the group PDA signer.
- Payout amount and close timestamp use checked arithmetic and return `ArithmeticOverflow`.
