# Story 4.2 ATDD: `claim_payout`

## Scenario 1: Recipient claims closed rotation payout

Given a 5-member `Active` group whose rotation `0` contribution period has closed
And the signer has a `MemberPosition` with `rotation_slot == 0`
When the signer calls `claim_payout(group, 0)`
Then the handler initializes a `RotationReceipt` PDA using `[ROTATION_SEED, group_pda, 0.to_le_bytes()]`
And the receipt records `group`, `rotation_index`, `recipient`, `amount`, `claimed_at`, and `bump`
And the handler transfers `5 * contribution_amount` from the vault to the recipient token account
And the handler emits `payout_claimed`.

## Scenario 2: Active group and recipient binding precede token movement

Given a claim request for any rotation
When validation runs
Then `GroupStatus::Active`, `MemberPosition.group`, `MemberPosition.member_pubkey`, and `rotation_slot` checks occur before token CPI.

## Scenario 3: Closed period uses strict Solana clock semantics

Given rotation `i`
When `Clock.unix_timestamp <= group.start_timestamp + (i + 1) * group.contribution_period`
Then the claim is rejected
And when `Clock.unix_timestamp` is greater than that close timestamp
Then the close-time guard passes.

## Scenario 4: Payout math is checked raw token math

Given `n` and `contribution_amount`
When calculating payout
Then the amount is `u64::from(n) * contribution_amount`
And overflow returns `SusuError::ArithmeticOverflow`.

## Scenario 5: No scheduler dependency

Given a closed rotation
When any signer submits the claim transaction with the recipient's member position and token account
Then no keeper, cron, scheduler, oracle, or bot account is required by the account context.

