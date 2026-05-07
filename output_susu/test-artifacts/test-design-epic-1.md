---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted:
  - step-01-detect-mode
  - step-02-load-context
  - step-03-risk-and-testability
  - step-04-coverage-plan
  - step-05-generate-output
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-05-06T10:49:24Z'
---

# Test Design: Epic 1 - Project Bootstrap, Foundation & IDL Freeze

**Date:** 2026-05-06
**Author:** Dre
**Status:** Draft

---

## Executive Summary

**Scope:** Full epic-level test design for Epic 1.

**Risk Summary:**

- Total risks identified: 11
- High-priority risks (>=6): 4
- Critical categories: TECH, SEC, OPS

**Coverage Summary:**

- P0 scenarios: 10 (~28-40 hours)
- P1 scenarios: 14 (~22-34 hours)
- P2/P3 scenarios: 18 (~14-28 hours)
- **Total effort**: ~64-102 hours (~8-13 days)

---

## Not in Scope

| Item | Reasoning | Mitigation |
| --- | --- | --- |
| Epic 2-9 protocol and app behavior | Epic 1 is bootstrap/foundation only | Future epic-level test-design workflows |
| Mainnet immutability burn verification (FR30) | Post-audit Epic 9 activity | Track via immutability workflow in Epic 9 |
| UX/skin/locale runtime behavior | Delivered in Epic 7 and Epic 8 | Validate with dedicated UI test plans later |

---

## Risk Assessment

### High-Priority Risks (Score >=6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-001 | TECH | IDL hash freeze drift is introduced and not caught before merge | 2 | 3 | 6 | Enforce `scripts/check-idl-hash.sh` in CI, fail PRs on mismatch | Dev | Story 1.4 |
| R-002 | OPS | Toolchain/version drift breaks reproducibility and public reruns | 2 | 3 | 6 | Pin Node/pnpm/Rust/Anchor versions and verify in CI bootstrap job | Dev | Story 1.1 + 1.4 |
| R-003 | DATA | Codama TS/Rust generated clients diverge from frozen IDL | 3 | 2 | 6 | Run `pnpm sdk:codegen` + parity checks + compile check (`cargo build -p susu-client`) | Dev | Story 1.3 + 1.4 + 1.6 |
| R-004 | SEC | Forbidden pattern checks miss seed/env/convex/style policy regressions | 2 | 3 | 6 | Gate with `scripts/check-patterns.sh` and review false negatives | Dev | Story 1.4 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R-005 | BUS | Contribution and translation docs are incomplete for fork developers | 2 | 2 | 4 | Review content against FR48/FR51 checklist before merge | Dev |
| R-006 | OPS | Daily log discipline starts late or gaps occur after T+0 | 1 | 3 | 3 | Require `log/YYYY-MM-DD.md` creation in Story 1.6 and ongoing routine | Dev |
| R-007 | TECH | Surfpool spike blocks Epic 2 test strategy due unresolved compatibility | 2 | 2 | 4 | Timebox spike and document LiteSVM fallback clearly | Dev |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| --- | --- | --- | --- | --- | --- | --- |
| R-008 | PERF | CI runtime exceeds target while scope is still small | 1 | 2 | 2 | Monitor |
| R-009 | DATA | Dependabot update noise obscures important security updates | 1 | 2 | 2 | Monitor |
| R-010 | BUS | Placeholder badges in README confuse early readers | 1 | 1 | 1 | Monitor |
| R-011 | OPS | Issue/PR templates miss required metadata fields | 1 | 2 | 2 | Monitor |

### Risk Category Legend

- **TECH**: Technical/Architecture
- **SEC**: Security and policy-safety
- **PERF**: Performance and runtime
- **DATA**: Data and artifact integrity
- **BUS**: Developer/community impact
- **OPS**: Delivery process and governance

---

## Entry Criteria

- [ ] Epic 1 scope is agreed (Stories 1.1-1.6)
- [ ] `output_susu/planning-artifacts/epics.md`, `architecture.md`, `prd.md` are available
- [ ] CI runner baseline (Ubuntu latest + Node 20 + pnpm 9 + pinned Rust) is documented
- [ ] Frozen IDL artifact path (`programs/susu/idl/susu.json`) exists
- [ ] Story status source (`output_susu/implementation-artifacts/*.md`) is available

## Exit Criteria

- [ ] All P0 tests passing
- [ ] All P1 tests passing or explicitly waived
- [ ] No open high-risk (score >=6) item without mitigation
- [ ] FR28/FR29/FR51/FR55/FR58 checks verified
- [ ] Epic 1 artifacts are reproducible on clean clone

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Foundational controls for immutability, reproducibility, and public trust.

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| FR28/FR29 IDL freeze integrity (`IDL_FREEZE.md` vs `programs/susu/idl/susu.json`) | Integration | R-001 | 2 | Dev | `scripts/check-idl-hash.sh` hard fail |
| FR58 public CI rerun baseline (PR + push to main jobs) | Integration | R-002 | 2 | Dev | CI workflow trigger + matrix sanity |
| Seed/env/convex/style forbidden patterns policy | Static | R-004 | 3 | Dev | `scripts/check-patterns.sh` |
| Daily log start-of-discipline (`log/2026-05-06.md`) | Docs | R-006 | 1 | Dev | File exists + content completeness |
| LICENSE + public-from-commit-zero posture in docs | Docs | R-005 | 2 | Dev | MIT verbatim + README statements |

**Total P0**: 10 scenarios, ~28-40 hours

### P1 (High) - Run on PR to main

**Criteria**: Critical foundations with medium risk or common breakage surface.

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| Story 1.1 workspace bootstrap (`pnpm install`, `cargo metadata`) | Build | R-002 | 2 | Dev | Cold-start execution |
| Story 1.2 Anchor shell + IDL output surface (9 instructions + args) | Build | R-001 | 3 | Dev | `anchor build` + IDL inspection |
| Story 1.3 codegen + Rust compile status | Build | R-003 | 3 | Dev | `pnpm sdk:codegen` + `cargo build -p susu-client` |
| Story 1.4 CI scripts exist + execute expected checks | Integration | R-004 | 2 | Dev | Script invocation and failure paths |
| Story 1.5 contribution/i18n docs and CODEOWNERS coverage | Docs | R-005 | 2 | Dev | FR48/FR51 checklist |
| Story 1.6 spike docs (`codama-rust-status.md`, `surfpool-status.md`) | Docs | R-007 | 2 | Dev | Status + fallback documented |

**Total P1**: 14 scenarios, ~22-34 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary or governance-oriented checks.

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| README link validity and badge placeholders | Docs | R-010 | 4 | Dev | Link checker/manual pass |
| Dependabot config policy (npm/cargo/actions weekly) | Integration | R-009 | 3 | Dev | YAML schema and update scopes |
| Template quality of issue/PR forms | Component | R-011 | 3 | Dev | Markdown frontmatter and sections |

**Total P2**: 10 scenarios, ~8-16 hours

### P3 (Low) - Run on-demand

**Criteria**: Exploratory and long-tail governance verification.

| Requirement | Test Level | Test Count | Owner | Notes |
| --- | --- | --- | --- | --- |
| Contributor journey dry-run from README to first PR | Exploratory | 4 | Dev | Community onboarding rehearsal |
| CI failure-mode drills (intentional hash mismatch/pattern violation) | Integration | 4 | Dev | Validate red-path signal quality |

**Total P3**: 8 scenarios, ~6-12 hours

---

## Execution Order

### Smoke Tests (<5 min)

- [ ] `pnpm install` in workspace root
- [ ] `cargo metadata --format-version 1`
- [ ] `scripts/check-idl-hash.sh` (pass case)

**Total**: 3 scenarios

### P0 Tests (<10 min)

- [ ] CI workflow trigger and baseline jobs fire on PR event
- [ ] Pattern guard script catches seeded violation sample
- [ ] `IDL_FREEZE.md` hash parity validates
- [ ] Daily log artifact exists and is non-empty

**Total**: 4 scenarios

### P1 Tests (<30 min)

- [ ] `anchor build` produces `programs/susu/target/idl/susu.json`
- [ ] `pnpm sdk:codegen` refreshes generated TS/Rust outputs
- [ ] `cargo build -p susu-client` compiles generated Rust client
- [ ] Contribution docs checklist reviewed to completion

**Total**: 4 scenarios

### P2/P3 Tests (<60 min)

- [ ] README/documentation link sweep
- [ ] Dependabot + template schema checks
- [ ] CI negative-path drill for hash and pattern checks

**Total**: 3 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
| --- | --- | --- | --- | --- |
| P0 | 10 | 2.8-4.0 | 28-40 | Build/CI governance and freeze contract |
| P1 | 14 | 1.6-2.4 | 22-34 | Foundation validation across stories |
| P2 | 10 | 0.8-1.6 | 8-16 | Secondary docs/config checks |
| P3 | 8 | 0.75-1.5 | 6-12 | Exploratory confidence checks |
| **Total** | **42** | **-** | **64-102** | **~8-13 days** |

### Prerequisites

**Test Data:**

- Fixed sample hash fixture for `IDL_FREEZE.md` parity validation
- Sample violation fixture set for pattern-check failure tests

**Tooling:**

- Anchor CLI 1.0.x and Solana CLI
- pnpm 9.x, Node 20 LTS, Rust toolchain from `rust-toolchain.toml`

**Environment:**

- Ubuntu CI runner parity with local dev shell
- GitHub Actions enabled for PR/push validation

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100%
- **P1 pass rate**: >=95%
- **P2/P3 pass rate**: >=90%
- **High-risk mitigations**: 100% complete or waived by maintainer

### Coverage Targets

- **Freeze and immutability controls (FR28/FR29 scope)**: 100%
- **CI/public rerun controls (FR58 scope)**: 100%
- **Bootstrap reproducibility checks**: >=80%
- **Documentation/governance checks**: >=80%

### Non-Negotiable Requirements

- [ ] `scripts/check-idl-hash.sh` enforces hash equality
- [ ] `scripts/check-patterns.sh` blocks forbidden patterns
- [ ] CI workflow is public and re-runnable
- [ ] Daily log discipline starts at `log/2026-05-06.md`

---

## Mitigation Plans

### R-001: IDL freeze drift escapes review (Score: 6)

**Mitigation Strategy:** Enforce deterministic hash check in CI and local pre-merge commands; require same-PR freeze updates with justification.
**Owner:** Dev
**Timeline:** Complete by Story 1.4
**Status:** Planned
**Verification:** Deliberately mutate `programs/susu/idl/susu.json` and confirm CI fails.

### R-002: Toolchain/version drift breaks reproducibility (Score: 6)

**Mitigation Strategy:** Keep pinned versions in `.nvmrc`, `rust-toolchain.toml`, workflow setup actions, and verify via bootstrap scripts.
**Owner:** Dev
**Timeline:** Stories 1.1 and 1.4
**Status:** Planned
**Verification:** Clean clone run of `pnpm install`, `cargo metadata`, `anchor build` on CI.

### R-003: Codama TS/Rust client drift (Score: 6)

**Mitigation Strategy:** Regenerate both SDKs from frozen IDL in CI and compile Rust client; document fallback if renderer is partial.
**Owner:** Dev
**Timeline:** Stories 1.3, 1.4, 1.6
**Status:** Planned
**Verification:** `pnpm sdk:codegen` and `cargo build -p susu-client` pass in CI.

### R-004: Forbidden pattern policy not enforced (Score: 6)

**Mitigation Strategy:** Keep grep-based policy checks strict and maintain false-positive suppression only where explicitly approved.
**Owner:** Dev
**Timeline:** Story 1.4
**Status:** Planned
**Verification:** Inject known-bad examples and confirm script exits non-zero.

---

## Assumptions and Dependencies

### Assumptions

1. Epic 1 remains foundational (no production protocol logic commitments in this epic).
2. GitHub Actions remains the primary CI gate for FR58.
3. Anchor 1.0 and Codama renderer behavior are stable enough for baseline artifacts.

### Dependencies

1. `output_susu/planning-artifacts/epics.md` and `architecture.md` remain the source of truth for acceptance criteria.
2. Story sequence 1.1 -> 1.6 is followed to preserve dependency integrity.
3. Repository retains public accessibility from commit zero.

### Risks to Plan

- **Risk**: `gh` auth limitations in local shell reduce PR-state validation fidelity
  - **Impact**: Local-only checks may miss merge-state edge cases
  - **Contingency**: Prefer CI-grounded checks and explicit fallback notes

---

## Follow-on Workflows (Manual)

- Run `bmad-testarch-atdd` per Epic 1 story once implementation moves to active development.
- Run `bmad-testarch-test-review` after story-level changes land.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: TBD Date: TBD
- [ ] Tech Lead: TBD Date: TBD
- [ ] QA Lead: TBD Date: TBD

**Comments:**

---

## Interworking & Regression

| Service/Component | Impact | Regression Scope |
| --- | --- | --- |
| `programs/susu/idl/susu.json` | Freeze contract source | Hash check script + anchor build parity |
| `.github/workflows/ci.yml` | Public verification backbone | Trigger behavior + all required jobs |
| `scripts/check-patterns.sh` | Security/policy guardrail | Seed/env/style/convex violation checks |
| `CONTRIBUTING*.md` + `CODEOWNERS` | Community onboarding/governance | Docs completeness and ownership mapping |
| `log/2026-05-06.md` | NFR-O1/NFR-R5 compliance anchor | Presence and content quality checks |

---

## Appendix

### Knowledge Base References

- `risk-governance.md`
- `probability-impact.md`
- `test-levels-framework.md`
- `test-priorities-matrix.md`

### Related Documents

- PRD: `output_susu/planning-artifacts/prd.md`
- Epic: `output_susu/planning-artifacts/epics.md`
- Architecture: `output_susu/planning-artifacts/architecture.md`
- Story artifacts: `output_susu/implementation-artifacts/1-*.md`

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `bmad-testarch-test-design`
**Version**: 4.0 (BMad v6)
