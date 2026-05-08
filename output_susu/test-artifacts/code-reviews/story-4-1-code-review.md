# Code Review: Story 4.1 rotation-slot algorithm

Date: 2026-05-08
Scope: `main..HEAD` for Story 4.1
Mode: BMad code-review equivalent, sequential fallback
Spec: `output_susu/implementation-artifacts/4-1-rotation-slot-algorithm.md`

## Summary

No actionable findings remain.

## Review Layers

| Layer | Result | Notes |
| --- | --- | --- |
| Blind Hunter | Pass | Diff is cohesive to Story 4.1; no unrelated later Epic 4 claim/deadline/double-claim behavior added. |
| Edge Case Hunter | Pass | Assignment validates member-position owner, PDA, roster order, accepted status, writable data, and bijective slot mapping. Unsupported `n` is rejected. |
| Acceptance Auditor | Pass | ACs are covered: deterministic SHA-256 rank, `u8::MAX` to final slot at start, reproducibility tests, bijection tests, docs, and `slots_assigned` logs. |

## Checks Performed

- Reviewed `programs/susu/src/rotation.rs` for deterministic-only inputs and no timing/external entropy.
- Reviewed `programs/susu/src/instructions/start_contributions.rs` for assignment-before-activation and remaining-account validation.
- Reviewed `programs/susu/src/instructions/post_collateral.rs` for placeholder-compatible deterministic preview validation.
- Reviewed Story 4.1 ATDD and Rust tests for AC coverage.

## Residual Risks

- Full Anchor/LiteSVM instruction execution remains limited by the repository's current lightweight proxy-test pattern; Story 4.1 has in-process account-data coverage for the mutation path.
- Future Epic 4 payout stories must consume `MemberPosition.rotation_slot`; this PR intentionally does not implement claim/deadline/double-claim behavior.
