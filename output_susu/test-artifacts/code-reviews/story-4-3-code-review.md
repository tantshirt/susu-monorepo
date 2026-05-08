# Story 4.3 Code Review

Date: 2026-05-08
Story: 4.3 `non-recipient guard`
Issue: #40
Baseline: `main`

## Scope

- `programs/susu/src/instructions/claim_payout.rs`
- `programs/susu/tests/claim_payout.rs`
- `tests/atdd/story-4-3-non-recipient-guard.atdd.md`
- `tests/atdd/story-4-3-non-recipient-guard.static.red.test.mjs`

## Review Layers

- Blind Hunter: branch diff inspected for introduced logic defects.
- Edge Case Hunter: wrong-slot, non-member, forged PDA, guard-order, and receipt/write ordering paths inspected.
- Acceptance Auditor: compared against GitHub issue #40 and Epic 4 test design `4.3-INT-001` through `4.3-INT-005`.

## Findings

No actionable findings.

## Rationale

- `ClaimPayout.member_position` is derived with `[MEMBER_SEED, group.key(), member.key()]`, binding the PDA to the claiming signer.
- Account constraints require `member_position.group == group.key()` and `member_position.member_pubkey == member.key()`, blocking signer/account state mismatch.
- `member` remains a required signer and the recipient token account remains owned by that signer.
- `assert_rotation_recipient` maps wrong-slot members to `SusuError::NotRotationRecipient` and is called before funding checks, deadline checks, receipt field writes, and token CPI.
- The receipt PDA stays canonical by group and rotation, preserving Story 4.5's separate double-claim surface.

## Residual Risk

- Runtime transaction rollback for failed Anchor account validation is not covered by a full LiteSVM/Anchor token-transfer harness in this branch. The current branch follows the repository's existing static and pure Rust test style.
