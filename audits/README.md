# Audits

This directory is the public index for Susu Protocol audit artifacts. It tracks engagement status, SOW handling, report landing rules, and the evidence bundle sent to the audit firm.

## Engagement Status

| Firm | Scope | Engagement Date | Expected Delivery | Status | Report Path |
| --- | --- | --- | --- | --- | --- |
| Primary audit firm TBD | Anchor program, frozen IDL, Curve Invariant, adversary artifact, threat model, permissionless contribution/claim/slash semantics | 2026-05-08 | TBD after SOW signature | Pending SOW / handoff-ready | `audits/{firm-slug}-{YYYY-MM}.pdf` |

SOW handling: the signed public SOW belongs at `audits/audit-sow.pdf` if disclosure is allowed. If the signed SOW is confidential, use the public summary at `audits/audit-sow-summary.md` and keep pricing, proprietary methodology, and firm-internal terms out of Git.

## Reproduction & Verification

The Day-1 handoff gives the firm the same evidence paths judges and integrators use:

| Artifact | Path | Purpose |
| --- | --- | --- |
| IDL freeze record | `IDL_FREEZE.md` | Frozen interface hash and freeze policy. |
| Frozen IDL JSON | `programs/susu/idl/susu.json` | Program interface artifact for audit scope. |
| Curve invariant property test | `tests/invariants/no_strategic_default.rs` | Required final-report citation for NFR-S1. |
| Adversary report | `audits/adversary/adversary-report.json` | Required final-report citation for NFR-S1. |
| Threat model | `docs/threat-model.md` | Attack models, mitigations, and residual risks. |
| Threat-model coverage matrix | `tests/coverage/threat-model.md` | Verifiable path mapping for threat-model claims. |
| Collateral curve write-up | `docs/collateral-curve.md` | Human-readable curve derivation and proof sketch. |
| FinCEN framing | `docs/fincen-cvc-framing.md` | Structural compliance posture for audit context. |
| Architecture | `output_susu/planning-artifacts/architecture.md` | System boundaries, audit strategy, and immutability posture. |

Run the handoff script after upstream Epic 5 artifacts have landed:

```sh
bash scripts/audit-handoff.sh --firm "<firm-slug>"
```

The script writes `audits/handoff-YYYY-MM-DD.tar.gz` and `audits/handoff-YYYY-MM-DD.MANIFEST.txt`. Both are gitignored because handoff bundles are per-engagement transfer artifacts.

While concurrent Epic 5 root-story PRs are still landing, use preflight mode to see exactly which upstream artifacts are missing:

```sh
bash scripts/audit-handoff.sh --allow-missing --firm "<firm-slug>"
```

## Report Landing Checklist

When the audit report is delivered:

1. Commit the final report at `audits/{firm-slug}-{YYYY-MM}.pdf`, for example `audits/ottersec-2026-08.pdf`.
2. Run `bash scripts/check-audit-report-citations.sh audits/{firm-slug}-{YYYY-MM}.pdf`.
3. Confirm the report text cites both `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json`.
4. Update the `Engagement Status` row to `Delivered`, `Passed`, or `Findings tracked`, and replace the placeholder report path with the committed PDF path.
5. File every Informational finding as a public GitHub issue using the findings tracker policy below.
6. Add a `/log/YYYY-MM-DD.md` entry with delivery date, firm name, scope, report path, and finding counts by severity.

Do not commit a placeholder report PDF. A missing report is represented by the status table, not by a fake artifact.

## README Badge Transition

TODO: Epic 8 / Story 8.x must wire the root README audit badge to read from the status field in `audits/README.md`.

Badge state rules:

- `audit-pending`: no delivered report is committed yet.
- `audit-passed`: delivered report is committed, the citation check passes, and the report shows zero Critical and zero High findings.
- `audit-findings-tracked`: delivered report is committed, the citation check passes, zero Critical and zero High findings remain, and Informational findings are tracked publicly.

Story 5.8 does not edit the root `README.md`; Epic 8 owns the visual badge implementation.

## Findings Tracker

All Informational audit findings must be public GitHub issues with mitigation status.

Required labels:

- `audit-finding`: open audit finding or mitigation task.
- `audit-finding-resolved`: mitigation merged or finding explicitly accepted with rationale.

Process:

1. File one issue per Informational finding.
2. Include the report path, finding title, severity, affected files, and mitigation plan.
3. Link mitigation PRs from the issue.
4. Close the issue only after mitigation is merged or a documented acceptance rationale is approved.
5. Add `audit-finding-resolved` when the finding is closed.

Optional: maintain a GitHub Project view filtered by `label:audit-finding`.

## Daily Log Requirements

Day 1 handoff log entry:

- Firm name or public firm slug.
- Scope.
- Frozen IDL commit.
- Handoff bundle date.
- Expected delivery date.

Report landing log entry:

- Report path.
- Citation-check result.
- Finding count by severity.
- Links to every `audit-finding` issue.
