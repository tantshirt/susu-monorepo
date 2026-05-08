# Susu Protocol Threat Model

## Scope

This document covers the Epics 2-4 on-chain program surface: group creation, invite acceptance, collateral posting and top-up, deterministic rotation assignment, member contribution, permissionless payout claim, completion, collateral withdrawal, cancellation, and slashing. It records the adversary models that public documentation may claim as mitigated today and separates those claims from residual risks that still need Epic 5 follow-up evidence.

The traceability matrix for these claims lives in `tests/coverage/threat-model.md`. Every cited evidence path in that matrix must already exist in the repository.

## Strategic-Default Curve Attack

Attack vector: A member joins a group, receives or expects an early payout, then stops contributing because the value of defaulting is higher than the value of staying honest.

Mitigation: The protocol requires accepted members to post collateral before the group starts. `post_collateral` derives the member's deterministic slot, calls the canonical curve through `calculate_collateral`, and rejects undercollateralized starts through `start_contributions`. Payout also requires every accepted member's `MemberPosition` record to show the exact contribution amount for the claimed rotation before the vault transfer executes.

Residual risk: The current evidence covers the curve implementation, golden fixture parity, collateral gate, and exact funding checks. The stronger Story 5.1 no-strategic-default proptest is not cited here until it exists, so public docs must not claim the 10K-case invariant is complete from this story alone.

## Late-Position Cartel (30% Cartel Scenario)

Attack vector: A late-position cartel, including the named 30% Cartel scenario, coordinates defaults after earlier members have already been paid and tries to leave honest members underfunded while cartel members keep upside.

Mitigation: The current on-chain controls combine overcollateralization, deterministic rotation slots, exact per-rotation contribution checks, receipt-backed claims, and slashing/withdrawal constraints. A cartel cannot claim a payout unless the realized slot recipient signs after the rotation closes and every accepted member's contribution record for that rotation matches `group.contribution_amount`.

Residual risk: The named 30% Cartel adversary simulator from Story 5.3 is not present in this checkout. Until that scenario exists, this document can claim only the component mitigations already tested by curve, claim, and lifecycle coverage, not a full adversary-simulation result.

## DoS via Permissionless Claim

Attack vector: An attacker attempts to block or front-run payout execution by forcing claims through a centralized executor, claiming before the period closes, claiming as the wrong recipient, withholding required member accounts, or replaying a prior claim.

Mitigation: `claim_payout` is a permissionless pull instruction. The realized rotation recipient signs the claim, the handler rejects pre-deadline claims, verifies the signer owns the requested `rotation_slot`, requires the full accepted-member position list, and transfers only after all contribution records are verified. The `RotationReceipt` PDA is initialized during account validation, so a replay for the same group and rotation fails before a second vault transfer.

Residual risk: Permissionless claim availability still depends on at least one honest party submitting the transaction after the rotation closes. The protocol does not introduce an availability keeper, so external transaction delivery remains outside the program.

## Malicious PDA Collision

Attack vector: An attacker tries to substitute a lookalike group, member position, vault, or rotation receipt account by colliding seeds, omitting domain separation, or reusing a receipt across rotations.

Mitigation: Program accounts use domain-separated seeds from `programs/susu/src/seeds.rs`, Anchor seed constraints, group ID checks, token mint/authority constraints, and per-rotation receipt seeds that include `rotation_index.to_le_bytes()`. Tests verify receipt PDA isolation, member-position PDA derivation, and rotation-slot seed determinism.

Residual risk: PDA derivation safety depends on keeping all seed constants centralized and avoiding literal seed drift in future instructions. Repository pattern checks and Story 4 static tests reduce that risk, but every new account family still needs explicit seed review.

## Untrusted On-Chain Data Deserialization

Attack vector: A claimant supplies arbitrary remaining accounts that deserialize into plausible `MemberPosition` data but belong to another program, another group, another member, or the wrong PDA.

Mitigation: `verify_rotation_funded` rejects remaining accounts unless each account is owned by the Susu program, deserializes as `MemberPosition`, matches the expected group, matches the accepted roster member, has the exact derived member-position PDA, and contains the exact contribution record for the rotation being claimed.

Residual risk: This defense is strongest on the claim path covered by current tests. Future instructions that accept remaining accounts or deserialize untrusted account data must repeat the owner, PDA, group, and member checks instead of relying on deserialization alone.

## Custodial Path Inadvertent Introduction

Attack vector: A future change introduces protocol custody by letting an admin, service wallet, keeper, or non-user authority move user funds, claim payouts, withdraw collateral, or route funds through a protocol-controlled account outside the group PDA.

Mitigation: Current fund movements use SPL Token `TransferChecked` with member-owned token accounts for member debits/credits and the group PDA as the vault authority for protocol-held escrow. Claim and lifecycle tests assert payout authority and zero terminal modeled balances. No fee, yield, or admin sweep path is part of the current program surface.

Residual risk: Custodial drift is a change-management risk, not a one-time code property. New instructions, SDK helpers, or reference-app flows that add admin transfer authority, protocol fees, delegated custody, or yield integrations must be reviewed against this threat model and the FinCEN posture checks.

## Scheduler or Keeper Introduction

Attack vector: A developer adds a scheduler, keeper, bot, cron job, external executor, Chainlink/Clockwork integration, or other automation layer that becomes required for payout progress or privileged settlement.

Mitigation: The payout lifecycle is pull-based. `claim_payout` is a signed user transaction, `complete_group` is an explicit signed transition after all receipts exist, and Story 4.6 static coverage scans the lifecycle path for scheduler-style dependency tokens. The protocol records Surfpool status separately instead of treating an unavailable external runner as required production machinery.

Residual risk: Off-chain services can still be built around the protocol for notifications or UX. They must remain optional helpers and cannot become the only path to claim, complete, or withdraw.

## Double-Claim Defense

Attack vector: A paid rotation is claimed a second time, or a receipt for one rotation is reused to block or satisfy another rotation.

Mitigation: `RotationReceipt[i]` is the canonical on-chain proof that rotation `i` has been paid for a group. The receipt PDA is derived from `ROTATION_SEED`, the group PDA, and `rotation_index.to_le_bytes()`, so each group rotation has exactly one possible receipt account.

`claim_payout` uses the Anchor `init` constraint on that receipt PDA. A first valid claim creates the receipt before recording payout metadata. A second claim for the same group and rotation tries to initialize an already-existing PDA and fails during account validation, before the handler reaches the `transfer_checked` vault CPI. This keeps the guard structural instead of relying on a runtime boolean in `Group` or `MemberPosition` that could drift from receipt state.

The Story 4.5 regression coverage lives in `programs/susu/tests/claim_payout.rs` and `tests/atdd/story-4-5-double-claim-guard.static.red.test.mjs`. Those tests lock account-validation-time receipt initialization, absence of existing-receipt mutation paths, and per-rotation PDA isolation.

Residual risk: Client layers should map the account-initialization failure to a stable duplicate-claim UX error. The on-chain defense does not depend on that mapping.

## Immutability Gate

The immutability gate is a security feature because, once the audited program is frozen and upgrade authority is burned, users and auditors can rely on the reviewed bytecode staying fixed instead of trusting an operator to avoid privileged changes.

The same gate is also a no-hotfix constraint. After immutability, defects cannot be patched in place through an upgrade authority. Release readiness must therefore depend on pre-freeze testing, audit signoff, reproducible evidence, and clear residual-risk acceptance.
