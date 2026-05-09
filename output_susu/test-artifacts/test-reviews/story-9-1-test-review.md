# Story 9.1 — Test Review

**Story:** Audit sign-off gate verification (NFR-S1)
**Reviewer:** Story Pilot
**Date:** 2026-05-09
**Test file:** `tests/atdd/story-9-1-audit-signoff-gate.static.red.test.mjs`
**ATDD doc:** `tests/atdd/story-9-1-audit-signoff-gate.atdd.md`

## Coverage map vs acceptance criteria

| AC (epics §9.1 + orchestrator brief) | Test name | Status |
| --- | --- | --- |
| `scripts/check-audit-signoff.sh` exists, is executable, bash strict mode | "scripts/check-audit-signoff.sh exists and is executable" | ✓ |
| Reads `audits/audit-summary.json` and asserts `critical == 0 && high == 0` | "script enforces audit invariants in non-skip mode" | ✓ |
| Verifies signed-off sentinel (`audits/SIGNED_OFF` or `signed_off:` field) | same | ✓ |
| Verifies a committed audit report PDF | same | ✓ |
| Honors `findings-tracker.md` blocking-finding resolution invariant | same | ✓ |
| Failure message points operator at Story 9.2 mainnet deploy gate | same | ✓ |
| Skip mode via `SUSU_AUDIT_GATE=skip` and `audits/SKIP_AUDIT_GATE` | "script supports SUSU_AUDIT_GATE=skip and audits/SKIP_AUDIT_GATE sentinel" | ✓ |
| `audits/SKIP_AUDIT_GATE` ships with this story and references Story 9.2 | "audits/SKIP_AUDIT_GATE sentinel is committed and points at Story 9.2" | ✓ |
| Behavior: pre-audit (sentinel present) exits 0 with skip message | "exits 0 with sentinel present (current pre-audit state)" — runs the script | ✓ |
| Behavior: enforce mode without artifacts exits 1 | "exits non-zero when forced to enforce without artifacts" — runs the script with `SUSU_AUDIT_GATE=enforce` | ✓ |
| `.github/workflows/audit-signoff.yml` runs gate, paths-filtered to mainnet artifacts | ".github/workflows/audit-signoff.yml runs the gate on mainnet-relevant paths" | ✓ |
| `package.json` exposes `audit:check` | "package.json exposes audit:check script" | ✓ |
| `CONTRIBUTING.md` documents the precondition | "CONTRIBUTING.md documents the audit sign-off precondition" | ✓ |

## Test quality

- **Hermetic:** static-only assertions plus two child-process invocations of the gate script. No network, no toolchain, no Solana RPC. Runs under `node --test` like every other Story 9.x ATDD file.
- **Behavioral coverage:** unique among Story 9.x — exercises the script in both skip and enforce modes via `execFileSync`, so the test matrix covers (a) the pre-audit state shipped with this PR, and (b) the post-audit state Story 9.2 will trigger when it deletes the sentinel.
- **Deterministic:** the only dynamic input is the `SUSU_AUDIT_GATE` env. Sentinel-driven path is observed at file-system level, not via mocks.
- **Forward compatibility:** asserts every path/filename Story 9.2's mainnet-deploy preflight will need to manipulate (the SKIP sentinel, the summary JSON, the SIGNED_OFF artifact, the findings tracker).

## Gaps / explicitly out of scope

- The workflow itself is asserted only by file/string presence + paths filter inclusion. Live workflow execution runs in CI. Same pattern as Story 5.8's `check-audit-report-citations.sh`.
- We do not assert behavior with a *populated* `audits/audit-summary.json`. That would require fixturing a passing-audit state, which Story 9.2 would then have to undo. The two invocations we do run (skip + enforce-empty) cover both real states this PR will be in.
- We do not validate the schema of `audits/audit-summary.json` beyond top-level fields used by the script. Story 9.2 may want to add a stricter JSON Schema; out of scope here.

## Decision

**APPROVED** — proceed to code review.
