# Audit SOW Summary

Status: public summary placeholder for a confidential or not-yet-publishable signed SOW.

## Scope

- Anchor program account validation and instruction safety.
- Frozen IDL review against `IDL_FREEZE.md` and `programs/susu/idl/susu.json`.
- Curve Invariant evidence review, including `tests/invariants/no_strategic_default.rs`.
- Adversary artifact review, including `audits/adversary/adversary-report.json`.
- Threat model and residual-risk review.
- Permissionless contribution, slashing, payout claim, and no-scheduler semantics.

## Engagement Dates

| Field | Value |
| --- | --- |
| Engagement date | 2026-05-08 |
| Expected delivery | TBD after firm confirmation |
| Public report path | `audits/{firm-slug}-{YYYY-MM}.pdf` |

## Deliverables

- Audit report with zero Critical and zero High findings before mainnet deployment.
- Explicit final-report citations to `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json`.
- Informational findings suitable for public GitHub issue tracking.

## Confidentiality Boundary

This summary intentionally excludes commercial terms, private contacts, internal audit procedures, and non-public negotiation terms. If the signed SOW is approved for publication, commit it as `audits/audit-sow.pdf` and keep this summary as historical context.
