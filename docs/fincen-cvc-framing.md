# FinCEN CVC Framing

## TL;DR

Susu's current on-chain program is framed as a structural posture, not as a legal conclusion: it is non-custodial, has no protocol fee path, and has no yield-routing CPI path. Under FinCEN FIN-2019-G001, issued May 9, 2019, that structure supports the view that the protocol team is not operating the type of CVC money-transmission business model the guidance discusses, because the team does not accept and transmit user value, charge transfer fees, or route funds into investment/yield activity.

This document is not legal advice, not a legal opinion, and not a guarantee of regulatory treatment. Story 5.9 owns counsel's firm letter at `docs/legal-opinion.pdf`; that letter controls any legal conclusion once published.

## Source

- FinCEN FIN-2019-G001, "Application of FinCEN's Regulations to Certain Business Models Involving Convertible Virtual Currencies," May 9, 2019: [official FinCEN page](https://www.fincen.gov/index.php/resources/statutes-regulations/guidance/application-fincens-regulations-certain-business-models).

## Structural Clauses

### 1. No Protocol-Team Keys To User-Controlled Token Accounts

The protocol team holds no keys for a user's token account and does not receive signing authority over user-controlled token accounts. User-side token movement is user-signed, and program-side custody is constrained to PDA-derived accounts that exist for the group lifecycle rather than for operator discretion.

The framing depends on that distinction. A protocol-team key, admin signer, or operator-controlled token-account authority that can move user funds would change the posture and require legal re-review.

### 2. No Fee Path In Instruction Handlers

The current instruction handlers do not skim a protocol fee, route basis points to a team treasury, or retain surplus amounts for the protocol. Token transfers are modeled around collateral, contributions, and payout movement within the savings-circle lifecycle.

This clause is structural, not aspirational. If a new handler or account constraint adds a fee recipient, treasury destination, spread capture, or retained operator balance, this document is stale until counsel reviews the new flow.

### 3. No Yield-Routing CPIs

The current program posture does not route funds into lending, staking, AMM, vault, or yield aggregator programs. CPI usage is expected to stay limited to token mechanics needed for the group lifecycle.

Any CPI that places group or member funds into a yield, investment, liquidity, staking, vault, or optimizer program would forfeit this framing until it is separately reviewed.

## Structural Enforcement

`scripts/check-fincen-posture.sh` is the CI structural check for this posture. It scans instruction handlers for:

- token-account initialization where authority is neither PDA-derived nor otherwise approved,
- token transfers to destinations outside the expected collateral/member/recipient paths,
- CPIs that are not locally allowlisted for token-program mechanics.

This script is not a legal-control system. It is an engineering guardrail that makes custody, fee, and CPI drift visible during review. The same posture also depends on ordinary code review of account constraints, signer checks, PDA seeds, and instruction-level token flow.

## Forfeiture Triggers

The current framing must be re-reviewed before release if any of the following changes land:

- an admin instruction that can move, redirect, pause-and-seize, or settle user or group funds outside user-signed lifecycle paths,
- an upgrade authority or operational control path that can redirect custody or payment flow after users deposit funds,
- a protocol fee, spread, treasury destination, skim, rebate capture, or retained operator balance,
- a yield CPI, yield-routing CPI, lending/staking/AMM/vault CPI, or strategy adapter,
- a keeper, scheduler, automation service, or off-chain executor that causes protocol-controlled fund movement without a user-submitted transaction,
- non-user-derived custody, including team-controlled token accounts, operator-controlled escrow, or signing authority over user-controlled token accounts,
- any frontend, relayer, API, or hosted service that accepts user funds or takes control of transfer timing outside the on-chain program's user/PDA flow.

Until counsel reviews those facts, do not reuse this framing for the changed design.

## Boundary Of This Document

This document explains the repository's structural posture for engineering and reviewer orientation. It does not decide whether any person, company, frontend operator, integrator, relayer, or deployment arrangement is or is not a money services business.

Story 5.9 owns the legal opinion workflow. When `docs/legal-opinion.pdf` is available, cite that firm letter for legal conclusions and use this document only as the technical map behind the opinion.
