# Story 4.2 Code Review

Date: 2026-05-08
Story: 4.2 `claim_payout`

## Finding

1. **High: payout could drain collateral instead of collected contributions.**
   The shared vault contains both collateral and contribution funds. The first implementation transferred `n * contribution_amount` after the period closed without proving the current rotation was funded by member contributions. If one or more members missed payment while collateral remained in the vault, the recipient could be paid from collateral before slash/default handling.

## Fix Applied

- Added `verify_rotation_funded` to require ordered remaining `MemberPosition` accounts for all group members.
- The funding check validates PDA owner/seeds, accepted roster order, contribution record rotation index, and exact `group.contribution_amount` for every member before token CPI.
- Added Rust and static tests that fail if the funding guard is removed or moved after the CPI.

## Result

- Actionable finding fixed.

