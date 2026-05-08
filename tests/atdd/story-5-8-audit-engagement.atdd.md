# ATDD: Story 5.8 Audit firm engagement + report linking

This artifact records the red-phase acceptance surface for Story 5.8.

## Scenarios

1. `audits/README.md` is the public audit artifact index and includes the required engagement status table, SOW handling, verification links, badge transition source of truth, and findings tracker policy.
2. `scripts/audit-handoff.sh` packages the audit Day-1 evidence bundle into `audits/handoff-YYYY-MM-DD.tar.gz`, writes a manifest, and never requires committing the transient tarball.
3. `scripts/check-audit-report-citations.sh` enforces NFR-S1 by checking that a delivered report cites `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json`.
4. The story explicitly avoids root `README.md` edits; Epic 8 owns the live badge UI.

## Generated Tests

- `tests/atdd/story-5-8-audit-engagement.static.red.test.mjs`
- `tests/atdd/story-5-8-audit-engagement.scripts.red.test.mjs`
