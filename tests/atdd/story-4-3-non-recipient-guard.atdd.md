# Story 4.3 ATDD: non-recipient `claim_payout` guard

GitHub issue: #40

## Scenario 1: 4.3-INT-001 wrong-slot member cannot claim another rotation

Given an Active group whose rotation `0` is ready to claim
And a signed member position whose `rotation_slot` is not `0`
When that member calls `claim_payout(group, 0)`
Then the handler returns `SusuError::NotRotationRecipient`
And the guard executes before deadline checks and token transfer.

## Scenario 2: 4.3-INT-002 non-member wallet cannot satisfy the member-position PDA

Given a wallet that is not in the group roster
When it calls `claim_payout` without a member-position PDA derived from `[MEMBER_SEED, group, wallet]`
Then Anchor account validation rejects the transaction before handler token movement.

## Scenario 3: 4.3-INT-003 forged recipient-slot PDA cannot be substituted

Given an attacker controls their signer key
And attempts to pass a `MemberPosition` account whose state claims the target recipient slot
When the account is not the PDA derived from `[MEMBER_SEED, group, attacker]`
Then Anchor seed validation rejects the account structurally.

## Scenario 4: 4.3-INT-003 forged PDA state cannot mismatch signer identity

Given the attacker passes their own derived member-position PDA
And the account data claims a different `member_pubkey`
When `claim_payout` validates accounts
Then the `member_position.member_pubkey == member.key()` constraint rejects the transaction.

## Scenario 5: 4.3-INT-004 valid recipient path remains available

Given the signer owns the member-position PDA and `rotation_slot == rotation_index`
When recipient validation runs
Then validation succeeds and later payout checks can proceed.
