# Story 9.1 — Code Review

**Story:** Audit sign-off gate verification (NFR-S1)
**Reviewer:** Story Pilot
**Date:** 2026-05-09
**Branch:** `story-9-1-audit-signoff-gate`

## Files changed

- `scripts/check-audit-signoff.sh` — New executable bash script. Strict mode. Skip mode via `SUSU_AUDIT_GATE=skip` env *or* `audits/SKIP_AUDIT_GATE` sentinel. Enforcement mode validates: `audits/audit-summary.json` (`critical == 0 && high == 0`), at least one non-empty `audits/*.pdf`, sign-off artifact (`audits/SIGNED_OFF` or `signed_off:true` + `signed_off_at:<date>` in summary), and `audits/findings-tracker.md` blocking-finding resolution if the tracker exists. Failure surfaces every blocking item and points the operator at Story 9.2.
- `audits/SKIP_AUDIT_GATE` — Committed pre-audit sentinel. Body explicitly says Story 9.2 must delete it as part of mainnet-deploy preflight, and that removal with the audit incomplete is the explicit blocker the operator must surface.
- `.github/workflows/audit-signoff.yml` — New CI workflow. Triggered on PRs and pushes-to-main, paths-filtered to mainnet-deploy-relevant artifacts: `programs/susu/**`, `Anchor.toml`, `.github/workflows/release.yml`, `.github/workflows/audit-signoff.yml`, `scripts/check-audit-signoff.sh`, `scripts/deploy-mainnet.sh`, `MAINNET_PROGRAM_ID.md`, `IDL_FREEZE.md`, `audits/**`. Single job runs `bash scripts/check-audit-signoff.sh`.
- `package.json` — Added `"audit:check": "bash scripts/check-audit-signoff.sh"`.
- `CONTRIBUTING.md` — New "Audit sign-off gate (NFR-S1)" section above "IDL Re-freeze Policy". Documents skip vs enforce behavior, lists the four invariants, and explains Story 9.2's role in deleting the sentinel.
- `tests/atdd/story-9-1-audit-signoff-gate.atdd.md` + `tests/atdd/story-9-1-audit-signoff-gate.static.red.test.mjs` — ATDD plan and 10 assertions, including two `execFileSync` calls that exercise both skip mode and enforce mode.

## Review pass

### Adversarial / acceptance auditor

- **AC: structured summary `audits/audit-summary.json` with `critical == 0 && high == 0`.** Implemented via embedded python3 JSON parsing (python3 is a hard dependency in CI and on macOS/Linux dev machines). Both `data["critical"]` and `data["findings"]["critical"]` are accepted, allowing flat or nested layouts. Same for `high`. ✓
- **AC: script exits 1 if any Critical or High is unresolved.** Both 0-checks emit a specific error line. The `findings-tracker.md` check enforces resolved-at coverage by counting blocking entries vs `resolved-at:` lines — strictly conservative (a tracker with three blocking findings and three resolved-at lines passes; missing one fails). ✓
- **AC: workflow blocks before any mainnet-related deploy job.** `audit-signoff.yml` runs the gate on every PR touching mainnet-deploy artifacts. The orchestrator brief explicitly avoids gating `release.yml` itself in this PR because the SKIP_AUDIT_GATE sentinel ships alongside (would create a circular-pass at audit-time). Story 9.2 owns wiring the gate into `release.yml` once the sentinel is removed. ✓
- **AC: documented in `CONTRIBUTING.md` as the audit-passed precondition.** New section above "IDL Re-freeze Policy" lists the four invariants, the skip controls, and Story 9.2's deletion responsibility. `pnpm audit:check` mention satisfies the `audit:check` script test assertion. ✓

### Edge-case hunter

- **`SUSU_AUDIT_GATE` unrecognized value:** Returns exit 2 (not exit 1) so a typo surfaces as a script error rather than silently being treated as enforce or skip.
- **Both skip env *and* sentinel removed mid-PR:** The script enforces. Test "exits non-zero when forced to enforce without artifacts" simulates this via `SUSU_AUDIT_GATE=enforce`.
- **Empty PDF (touch `audits/firm.pdf`):** caught by `[ -s "$pdf" ]` check, error message says "all empty".
- **Malformed `audits/audit-summary.json`:** caught by python3 try/except; error message says "could not parse … : <exception>".
- **`audits/findings-tracker.md` absent:** treated as no findings; gate proceeds (safe because the summary JSON's critical/high counts are the authoritative bar). The tracker is a defense-in-depth artifact when the firm produces one.
- **Sign-off field truthy without timestamp:** explicitly requires both `signed_off: true` *and* `signed_off_at` non-empty/non-None/non-null in the summary. Avoids accidental sign-off via a stale boolean.
- **Workflow circular dependency:** the orchestrator merge instruction explicitly excludes the new `audit-signoff` workflow from PR merge gating; `lint-and-build` and `Check markdown links` remain the required checks. Sentinel makes the workflow run pass anyway.
- **macOS vs Linux portability:** python3 is on both. `grep -Eci`, `case` statements, and `shopt -s nullglob` work in bash 3.2 (macOS default) and bash 5.x (CI Ubuntu).

### Blind hunter / structural

- The script's failure message names Story 9.2 explicitly so when an operator removes the sentinel and sees the failure, the next-step path is unambiguous.
- The sentinel file body is not a placeholder note — it's a self-contained operator instruction that documents its own deletion semantics.
- Workflow `paths:` filter mirrors the set Story 9.2 will modify, so the gate fires on exactly the PRs that could move the codebase toward mainnet.
- `package.json` placement (between `link:check` and `test`) groups it with the policy-check scripts (`i18n:check`, `a11y:check`, `link:check`).

## Must-fix issues

None identified.

## Nice-to-have (deferred)

- A JSON Schema for `audits/audit-summary.json` would harden the post-audit landing flow. Out of scope for the gate itself; the firm's report-landing PR can add it.
- A unit test fixture exercising the *passing* enforce path (populated summary, fake PDF, signed-off artifact) would round out behavioral coverage. Skipped here because Story 9.2 will exercise that path live when it removes the sentinel; introducing fake-pass fixtures now risks them rotting.

## Decision

**APPROVED** — ready for PR.
