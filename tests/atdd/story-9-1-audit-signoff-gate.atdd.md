# Story 9.1 — Audit sign-off gate verification (NFR-S1) — ATDD

**GH issue:** #90

**Goal:** Block mainnet deploy (Story 9.2) until the audit firm's report shows zero Critical and zero High findings, with structural sign-off recorded in repo.

## Given / When / Then

**Given** the audit engagement workflow from Story 5.8 (audit firm engaged, SOW summarized, Day-1 handoff bundle ready)
**When** Story 9.1 lands
**Then** `scripts/check-audit-signoff.sh` exists, is executable, and:

1. Defaults to **fail** when no audit summary, report PDF, or sign-off sentinel is committed.
2. Honors a deliberate pre-audit **skip mode** via env `SUSU_AUDIT_GATE=skip` *or* committed sentinel `audits/SKIP_AUDIT_GATE`. Skip mode exits 0 with a "skipped (pre-audit)" message.
3. In non-skip mode, asserts:
   - `audits/audit-summary.json` exists with `critical == 0` and `high == 0` (per epics §9.1 AC).
   - At least one `audits/{firm-slug}-{YYYY-MM}.pdf` is committed and non-empty.
   - `audits/SIGNED_OFF` sentinel (or `signed_off: true` field in `audits/audit-summary.json`) is present.
   - If `audits/findings-tracker.md` exists, every blocking (Critical/High) finding has `resolved-at:` recorded.
4. Surfaces the exact missing element on failure with a "this gate must pass before mainnet deploy (Story 9.2)" message.

**And** `audits/SKIP_AUDIT_GATE` ships with this story as a deliberate pre-audit sentinel; Story 9.2 will delete it as part of the mainnet-deploy preflight (any post-audit run with the sentinel still present must surface a clear blocker message in Story 9.2).

**And** `.github/workflows/audit-signoff.yml` runs `bash scripts/check-audit-signoff.sh` on PRs touching mainnet-deploy artifacts (`programs/susu/**`, `Anchor.toml`, `.github/workflows/release.yml`, `scripts/deploy-mainnet.sh`, `MAINNET_PROGRAM_ID.md`, `IDL_FREEZE.md`, `audits/**`).

**And** `package.json` exposes the gate as `pnpm audit:check`.

**And** `CONTRIBUTING.md` documents the audit-sign-off precondition for mainnet deploy.

## Out of scope (Story 9.2+)

- Actual mainnet deploy script — Story 9.2.
- Wiring the gate into `release.yml` as a hard precondition — Story 9.2 (the gate would be circular in this PR because the SKIP_AUDIT_GATE sentinel ships alongside it).
- Real audit findings — only land when the audit firm delivers the report.
