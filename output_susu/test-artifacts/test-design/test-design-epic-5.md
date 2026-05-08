---
workflowStatus: completed
totalSteps: 5
stepsCompleted:
  - step-01-detect-mode
  - step-02-load-context
  - step-03-risk-and-testability
  - step-04-coverage-plan
  - step-05-generate-output
lastStep: step-05-generate-output
nextStep: ''
lastSaved: '2026-05-08'
inputDocuments:
  - output_susu/implementation-artifacts/5-1-no-strategic-default-proptest.md
  - output_susu/implementation-artifacts/5-2-adversary-cli-skeleton.md
  - output_susu/implementation-artifacts/5-3-thirty-percent-cartel-scenario.md
  - output_susu/implementation-artifacts/5-4-deterministic-adversary-report.md
  - output_susu/implementation-artifacts/5-5-collateral-curve-doc.md
  - output_susu/implementation-artifacts/5-6-threat-model-doc.md
  - output_susu/implementation-artifacts/5-7-fincen-cvc-framing-doc.md
  - output_susu/implementation-artifacts/5-8-audit-engagement.md
  - output_susu/implementation-artifacts/5-9-legal-opinion.md
  - output_susu/implementation-artifacts/dependency-graph.md
  - output_susu/planning-artifacts/prd.md
  - output_susu/planning-artifacts/epics.md
  - output_susu/planning-artifacts/architecture.md
  - docs/surfpool-status.md
  - docs/threat-model.md
  - tests/coverage/threat-model.md
  - _bmad/tea/config.yaml
  - .agents/skills/bmad-testarch-test-design/resources/knowledge/risk-governance.md
  - .agents/skills/bmad-testarch-test-design/resources/knowledge/probability-impact.md
  - .agents/skills/bmad-testarch-test-design/resources/knowledge/test-levels-framework.md
  - .agents/skills/bmad-testarch-test-design/resources/knowledge/test-priorities-matrix.md
---

# Test Design: Epic 5 - Curve Verification, Adversary Simulation & Public Documentation

**Date:** 2026-05-08  
**Author:** Dre / BMAD Test Architect  
**Status:** Draft, local-only TEA output  
**Mode:** Epic-level test design

## Executive Summary

**Scope:** Epic-level test design for Epic 5 stories 5.1-5.9: Curve Verification, Adversary Simulation & Public Documentation.

Epic 5 turns the protocol's core claim into independently reproducible evidence: the no-strategic-default property test, a deterministic adversary binary and report, the 30% Cartel named scenario, public curve/threat/compliance docs, and audit/legal engagement artifacts. This design treats executable invariants, byte-deterministic reports, and documentation traceability as one evidence chain.

**Risk Summary:**

- Total risks identified: 14
- High-priority risks (score >= 6): 7
- Critical categories: DATA, SEC, OPS, PERF

**Coverage Summary:**

- P0 scenarios: 27, estimated ~42-70 hours
- P1 scenarios: 24, estimated ~28-50 hours
- P2/P3 scenarios: 9, estimated ~8-18 hours
- **Total effort:** ~78-138 hours, about ~2-4 engineering weeks depending on Surfpool/adversary harness maturity and vendor turnaround.

## Scope and Dependency Lanes

Epic 5 must be tested in dependency-aware lanes, not as a flat story list.

| Lane | Stories | Dependency Rule | Test Design Implication |
| --- | --- | --- | --- |
| Curve invariant lane | 5.1 | Depends on Story 3.1 curve module. | Start immediately with property-test harness, 10K case budget, and failure counterexample quality. |
| Adversary simulator lane | 5.2 -> 5.3 -> 5.4 | 5.3 requires 5.2; 5.4 requires 5.2 and 5.3. | Skeleton and determinism gates land before full report acceptance; 30% Cartel is a named fixture in the report. |
| Public proof/documentation lane | 5.5 | Requires 5.1 and 5.4. | Curve doc cannot claim verification complete until the proptest and adversary artifact exist at locked paths. |
| Threat/compliance docs lane | 5.6, 5.7 -> 5.9 | 5.6 and 5.7 are ready; 5.9 requires 5.7. | Threat traceability and FinCEN framing can start early; legal publication depends on framing doc and vendor workflow. |
| Audit operations lane | 5.8 | Depends on Story 1.2 IDL freeze. | Handoff bundle, citation checks, SOW/report index, and finding tracker can start immediately. |

Validation against `output_susu/implementation-artifacts/dependency-graph.md` confirms all Epic 5 stories 5.1-5.9 are represented above, with `5.1`, `5.2`, `5.6`, `5.7`, and `5.8` ready; `5.3`, `5.4`, `5.5`, and `5.9` gated by explicit upstream stories.

## Not in Scope

| Item | Reasoning | Mitigation |
| --- | --- | --- |
| Story implementation changes | This workflow owns test design artifacts only. | Hand off P0/P1 scenarios to ATDD/automation workflows when each story starts. |
| Sprint status mutation | User explicitly excluded sprint-status unless workflow requires it; this TEA run does not require it. | Report validation in this artifact and leave status changes to sprint/BAD workflow. |
| Root README badge implementation | Epic 8 owns README first-viewport and badge cluster. | Epic 5 test design verifies placeholders and handoff links expected by Epic 8. |
| Mainnet immutability enforcement | Epic 9 owns deploy/burn and live immutability checks. | Epic 5 audit/legal artifacts define gates and evidence required before Epic 9. |
| Vendor legal/audit conclusions | Stories 5.8 and 5.9 scaffold engagement; firms produce signed reports/letters. | Test the handoff, citation checks, placeholder paths, and tracking docs without fabricating vendor artifacts. |

## Risk Assessment

### High-Priority Risks (Score >= 6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |
| E5-001 | DATA | The no-strategic-default proptest duplicates or diverges from production curve logic, proving a copy instead of the real `expected_default_payoff`. | 2 | 3 | 6 | Import the canonical curve API from Story 3.1, forbid duplicated formula code in tests, and add static review around `tests/invariants/no_strategic_default.rs`. | Dev + QA | Story 5.1 |
| E5-002 | PERF | The 10K proptest exceeds the 180s NFR-P4 budget and is weakened by lowering case count. | 2 | 3 | 6 | Run release-mode timing on a 4-core baseline; optimize per-case math and fixture setup; CI must fail if cases <10K. | Dev + QA | Story 5.1 |
| E5-003 | DATA | The adversary report is not byte-reproducible because timestamps, unordered collections, environment values, or unseeded RNG leak into output. | 3 | 3 | 9 | Determinism grep gate, seeded `ChaCha20Rng`, sorted report structures, deterministic metadata, and cross-machine `cmp` job. | Dev + QA | Stories 5.2, 5.4 |
| E5-004 | SEC | The 30% Cartel scenario uses shortcuts, admin helpers, or in-memory settlement, so it does not falsify the real on-chain attack path. | 2 | 3 | 6 | Scenario must drive deployed program instructions through Surfpool or documented fallback; assert admin actions equal zero and honest/defector P&L. | Dev + QA | Story 5.3 |
| E5-005 | OPS | Surfpool/full-fidelity adversary execution remains unavailable or flaky, blocking the 10K report and audit evidence. | 2 | 3 | 6 | Keep LiteSVM fallback explicit for smoke only; Story 5.4 cannot claim canonical acceptance until Surfpool/full-fidelity path is green or waiver is approved. | QA + DevOps | Stories 5.2, 5.4 |
| E5-006 | SEC | Threat model documents mitigations that do not map to existing test or CI artifacts, producing unverifiable security claims. | 2 | 3 | 6 | `tests/coverage/threat-model.md` path-existence check in CI; remove or block unverified claims rather than citing missing files. | QA + Security | Story 5.6 |
| E5-007 | OPS | Audit or legal report links resolve but do not contain required citations/scope, weakening NFR-S1 and FR27 evidence. | 2 | 3 | 6 | Add citation-check script for audit PDFs, engagement trackers, SOW summary handling, and explicit fallback PDF semantics for legal opinion delays. | Andre + QA | Stories 5.8, 5.9 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| E5-008 | DATA | Proptest seed/regression handling is not deterministic enough for auditors to reproduce counterexamples. | 2 | 2 | 4 | Pin `PROPTEST_RNG_SEED`, commit regressions when failures occur, and print full tuple on failure. | Dev + QA |
| E5-009 | PERF | 10K adversary run exceeds the <=10 minute NFR-P5 budget. | 2 | 2 | 4 | Benchmark early with smaller runs, profile setup reuse, and add a workflow budget with margin. | DevOps |
| E5-010 | TECH | JSON report schema is underspecified and downstream README/audit checks cannot consume it reliably. | 2 | 2 | 4 | Contract-test report schema fields, stable scenario names, and fixture JSON validation. | Dev + QA |
| E5-011 | SEC | FinCEN framing overclaims legal conclusions instead of structural posture. | 2 | 2 | 4 | Prose review for banned legal-claim phrasing; legal opinion owns conclusions. | Andre + Legal |
| E5-012 | OPS | Vendor engagement artifacts expose confidential SOW or private firm details. | 1 | 3 | 3 | Use summary files when SOW is confidential and keep handoff tarballs gitignored. | Andre |
| E5-013 | DATA | `docs/collateral-curve.md` worked examples drift from curve fixtures. | 2 | 2 | 4 | Generate or verify example tables from curve module outputs and link to golden fixtures. | Dev + QA |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| --- | --- | --- | ---: | ---: | ---: | --- |
| E5-014 | OPS | Markdown/link tooling differs locally from CI and causes late doc churn. | 1 | 2 | 2 | Prefer repository scripts and CI-equivalent link checks. |

## Test Coverage Plan

Priority reflects protocol risk and acceptance criticality, not execution timing. Execution timing is handled separately in the PR/Nightly/Weekly strategy.

### Story 5.1 - `tests/invariants/no_strategic_default.rs` proptest

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 5.1-UNIT-001 | P0 | Rust property | `cargo test --test no_strategic_default --release` executes at least 10,000 proptest cases over `n in [3,12]`, contribution base units `$10-$10,000`, slot `[0,n)`, decimals 6. | E5-001, E5-002 |
| 5.1-UNIT-002 | P0 | Rust property | Every generated case imports the canonical curve API and asserts `expected_default_payoff < 0`; any `Err` fails with input tuple. | E5-001 |
| 5.1-UNIT-003 | P0 | CI/static | Test source contains no duplicated closed-form curve implementation beyond fixture comparison helpers. | E5-001 |
| 5.1-UNIT-004 | P0 | CI/perf | Release-mode run completes <=180s on a 4-core baseline; case count is not reduced to meet budget. | E5-002 |
| 5.1-UNIT-005 | P1 | Determinism | CI pins proptest seed and committed regressions reproduce failing counterexamples. | E5-008 |
| 5.1-UNIT-006 | P1 | Fault injection | Temporary sign/curve-flaw injection produces a shrunk counterexample with `n`, `slot`, `contribution`, `decimals`, and payoff. | E5-008 |

### Story 5.2 - `susu-adversary` CLI skeleton

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 5.2-INT-001 | P0 | CLI integration | `cargo run --bin susu-adversary -- --circles 10 --seed <64hex>` parses args, seeds `ChaCha20Rng`, emits schema-valid JSON, and exits 0 on known-good smoke. | E5-003, E5-010 |
| 5.2-UNIT-002 | P0 | Unit | Invalid seed length/non-hex input fails with stable error before simulator startup. | E5-003 |
| 5.2-UNIT-003 | P0 | Static/CI | Crate contains no `thread_rng`, `OsRng`, wall-clock, process/thread IDs, hostname, unordered report iteration, or floating-point output arithmetic. | E5-003 |
| 5.2-INT-004 | P1 | Harness | Simulator samples supported `n`, contribution, token mint, and defection pattern without reseeding mid-run. | E5-010 |
| 5.2-DOC-005 | P1 | Docs/link | `crates/susu-adversary/README.md` documents `--seed $COMMIT_SHA`, report fields, and deterministic constraints. | E5-010 |

### Story 5.3 - 30% Cartel scenario

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 5.3-INT-001 | P0 | Scenario integration | `thirty_percent_cartel` sets up exactly 10 members; members 4-6 default after member 3 payout; all lifecycle actions hit deployed program instructions. | E5-004 |
| 5.3-INT-002 | P0 | Scenario integration | Honest members 0-3 and 7-9 finish made whole, defectors 4-6 net negative, and `admin_intervention_count == 0`. | E5-004 |
| 5.3-INT-003 | P0 | Report contract | JSON `summary.scenarios_covered` includes `"30_percent_cartel"` and per-scenario result records max defector profit. | E5-004, E5-010 |
| 5.3-UNIT-004 | P1 | Unit | Setup-only test validates member roles, contribution progress through rotation 3, and synthetic "defector profited" assertion failure. | E5-004 |
| 5.3-DOC-005 | P1 | Docs/static | Scenario doc-comment explains why under-one-third cartel at slots 4-6 is the named falsification target. | E5-004 |

### Story 5.4 - Byte-deterministic adversary report

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 5.4-E2E-001 | P0 | Cross-machine CI | Linux x86_64 and macOS arm64 run the same seed and `cmp` byte-identical `audits/adversary/adversary-report.json`. | E5-003 |
| 5.4-E2E-002 | P0 | Full run | `cargo run --bin susu-adversary --release -- --circles 10000 --seed $COMMIT_SHA` completes with `max_defector_profit_lamports == 0`. | E5-003, E5-009 |
| 5.4-E2E-003 | P0 | Performance | 10K run completes <=10 minutes on 4-core baseline, with CI margin documented. | E5-009 |
| 5.4-UNIT-004 | P0 | Static/CI | Determinism symbol grep fails on time, unseeded RNG, unordered report iteration, env leaks, process/thread IDs, and floats. | E5-003 |
| 5.4-DOC-005 | P1 | Docs/link | `audits/adversary/README.md` contains the exact reproduction recipe and explains seed = commit SHA. | E5-010 |
| 5.4-INT-006 | P1 | Report contract | Report arrays sort by stable keys and JSON has fixed pretty format plus trailing newline. | E5-003 |

### Story 5.5 - `docs/collateral-curve.md`

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 5.5-DOC-001 | P0 | Docs/static | Doc starts with `## TL;DR`, defines Curve Invariant, includes closed-form formula, derivation, proof sketch, and explicit verifier paths. | E5-013 |
| 5.5-DOC-002 | P0 | Fixture/doc | Worked examples for `n in {3,5,10}` are generated or verified against the curve module/golden fixtures. | E5-013 |
| 5.5-DOC-003 | P0 | Link check | Links to `tests/invariants/no_strategic_default.rs`, `audits/adversary/adversary-report.json`, and `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs` resolve. | E5-013 |
| 5.5-DOC-004 | P1 | Comprehension | External non-cryptoeconomist dev can restate the invariant within 10 minutes; notes captured in completion record. | E5-013 |
| 5.5-DOC-005 | P1 | Markdown/render | Markdown lint and math rendering check pass; if math renderer is unavailable, fallback asset path is linked and checked. | E5-014 |

### Story 5.6 - Threat model and coverage matrix

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 5.6-DOC-001 | P0 | Docs/static | `docs/threat-model.md` enumerates required attacks: strategic default, 30% Cartel, claim DoS, PDA collision, unsafe deserialization, custodial path, scheduler/keeper introduction. | E5-006 |
| 5.6-DOC-002 | P0 | Traceability | `tests/coverage/threat-model.md` has one or more rows per documented attack with mitigation and existing test/script path. | E5-006 |
| 5.6-UNIT-003 | P0 | CI/script | Coverage checker parses the matrix and fails when any cited path is missing. | E5-006 |
| 5.6-DOC-004 | P1 | Docs/static | Threat model documents immutability as both security property and no-hotfix constraint. | E5-006 |
| 5.6-DOC-005 | P1 | Link check | Threat model and coverage matrix internal links resolve under CI-equivalent markdown-link-check. | E5-014 |

### Story 5.7 - FinCEN CVC framing

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 5.7-DOC-001 | P0 | Docs/static | `docs/fincen-cvc-framing.md` states structural posture only: non-custodial, non-fee, non-yield; does not make flat legal conclusions. | E5-011 |
| 5.7-DOC-002 | P0 | CI/script | `scripts/check-fincen-posture.sh` exists and is cited as enforcement for forbidden fee/yield/custody patterns. | E5-011 |
| 5.7-DOC-003 | P1 | Docs/static | Posture-forfeiting changes list includes admin instruction, upgrade authority, protocol fee, yield CPI, keeper/scheduler, and non-user-derived custody. | E5-011 |
| 5.7-DOC-004 | P1 | Link check | Links to FinCEN source, internal state paths, threat model, and legal opinion placeholder path resolve or are explicitly staged by 5.9. | E5-011 |

### Story 5.8 - Audit engagement and report linking

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 5.8-DOC-001 | P0 | Docs/static | `audits/README.md` index lists firm, scope, engagement date, expected delivery, status, report path, and findings tracker policy. | E5-007, E5-012 |
| 5.8-INT-002 | P0 | Script | `scripts/audit-handoff.sh` bundles frozen IDL, proptest, adversary report, threat model, curve doc, FinCEN framing, and architecture into a gitignored tarball. | E5-007 |
| 5.8-UNIT-003 | P0 | Script | `scripts/check-audit-report-citations.sh` passes on a mock PDF containing both required paths and fails when either citation is missing. | E5-007 |
| 5.8-DOC-004 | P1 | Docs/static | SOW handling documents either committed public SOW or summary path without confidential details. | E5-012 |
| 5.8-DOC-005 | P1 | Docs/static | README badge transition TODO is present but does not modify Epic 8 README scope. | E5-007 |

### Story 5.9 - Legal opinion engagement and publication

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 5.9-DOC-001 | P0 | Docs/static | `docs/legal-engagement.md` tracks firm, narrow scope, SOW signed date, expected delivery, status, and `docs/legal-opinion.pdf` path. | E5-007, E5-012 |
| 5.9-INT-002 | P0 | Script | Legal handoff bundles FinCEN framing, threat model, architecture, state/IDL context, and writes only gitignored transient bundle output. | E5-007 |
| 5.9-INT-003 | P0 | Script | `scripts/render-legal-placeholder.sh` can render a one-page fallback PDF without overclaiming if letter slips. | E5-007 |
| 5.9-DOC-004 | P1 | Docs/static | SOW handling uses public PDF or non-confidential summary and does not commit privileged drafts. | E5-012 |
| 5.9-DOC-005 | P1 | Link check | `docs/fincen-cvc-framing.md` forward link to `docs/legal-opinion.pdf` resolves after real or fallback PDF lands. | E5-007 |

## Execution Strategy

Run everything in PRs if the touched suite stays under 15 minutes; defer only expensive, full-environment, cross-machine, or vendor-dependent checks.

**PR:**

- Story-local P0/P1 unit, static, link, schema, and small CLI smoke tests.
- Determinism forbidden-symbol scans for `crates/susu-adversary/`.
- Threat model coverage path-existence check.
- Markdown lint/link checks for docs touched in the PR.
- Proptest release run for Story 5.1 if it remains <=180s; it is a release-blocking PR check once stabilized.

**Nightly:**

- Full 10K adversary run with `--seed $GITHUB_SHA`.
- Cross-machine byte comparison for `audits/adversary/adversary-report.json`.
- Performance trend for adversary run and proptest budget.

**Weekly/manual:**

- Vendor engagement handoff dry runs.
- Mock audit-report citation extraction with local PDF tooling.
- External developer comprehension review for collateral-curve doc.
- Legal placeholder render rehearsal, deleting rehearsal output afterward.

## Resource Estimates

| Priority | Scenario Count | Estimated Effort | Notes |
| --- | ---: | --- | --- |
| P0 | 27 | ~42-70 h | Property harness, adversary determinism, 30% Cartel, 10K run, traceability scripts, audit/legal handoff gates. |
| P1 | 24 | ~28-50 h | Docs quality, schema stability, setup tests, SOW confidentiality handling, markdown/link checks. |
| P2/P3 | 9 | ~8-18 h | Optional exploratory checks, deeper report consumers, additional scenario fixtures, manual rehearsal polish. |
| **Total** | **60** | **~78-138 h** | Excludes vendor review time and any implementation defects found by P0 tests. |

## Entry Criteria

- Epic 4 is complete, including payout lifecycle behavior needed by adversary simulation.
- Story 3.1 curve module exists and exports the canonical curve/payoff function for Story 5.1.
- `output_susu/implementation-artifacts/dependency-graph.md` confirms Epic 5 unblocked stories and dependency lanes.
- Rust/CI tooling can run property and CLI tests locally; Surfpool/full-fidelity status is tracked where needed.
- Audit/legal handoff scripts treat bundles as transient, gitignored outputs.

## Exit Criteria

- P0 pass rate is 100%.
- P1 pass rate is >=95%, or every failure has an owner, waiver, and residual-risk note.
- No score >=6 Epic 5 risk remains unmitigated before claiming Epic 5 done.
- Every Story 5.1-5.9 acceptance criterion maps to at least one test, script, or explicit vendor/process gate.
- `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json` are real, cited, reproducible artifacts before public/audit docs claim verification complete.
- Threat model coverage matrix cites only existing paths.
- Audit report publication cannot satisfy NFR-S1 unless required verifier file paths are present in the report text.
- Legal opinion link resolves to either the signed letter or an honest fallback PDF by submission close.

## Quality Gate Criteria

- **P0 pass rate:** 100%, no exceptions.
- **P1 pass rate:** >=95%; waivers require owner, date, affected story, and residual risk.
- **High-risk mitigations:** 100% complete or explicitly waived by Andre before Epic 5 completion.
- **Coverage target:** >=80% of acceptance criteria mapped to automated tests/scripts; 100% mapping for SEC/DATA high risks.
- **Security/documentation claims:** 100% of public claims must cite an existing test, script, report, or vendor artifact path.
- **Performance:** Story 5.1 <=180s; Story 5.4 <=10min for 10K adversary run on stated baseline.

## Mitigation Plans

### E5-001: Proptest proves copied logic instead of production curve

**Mitigation Strategy:** Import the canonical curve API, prohibit test-local formula copies, add static review for the invariant test, and require failure injection before completion.  
**Owner:** Dev + QA  
**Timeline:** Story 5.1  
**Status:** Planned  
**Verification:** `5.1-UNIT-002`, `5.1-UNIT-003`, `5.1-UNIT-006`

### E5-003: Adversary report is not byte-reproducible

**Mitigation Strategy:** Centralize seeded RNG, remove nondeterministic symbols, sort all output structures, make metadata deterministic, and compare bytes across Linux/macOS CI.  
**Owner:** Dev + QA  
**Timeline:** Stories 5.2 and 5.4  
**Status:** Planned  
**Verification:** `5.2-UNIT-003`, `5.4-E2E-001`, `5.4-UNIT-004`, `5.4-INT-006`

### E5-004: 30% Cartel does not exercise the real protocol

**Mitigation Strategy:** Require every lifecycle transition through program instructions, assert no admin action, and record honest/defector P&L in scenario result and report.  
**Owner:** Dev + QA  
**Timeline:** Story 5.3  
**Status:** Planned  
**Verification:** `5.3-INT-001`, `5.3-INT-002`, `5.3-INT-003`

### E5-006: Threat model claims lack test-backed traceability

**Mitigation Strategy:** Make the coverage matrix parseable, fail CI on missing paths, and move any untestable item to out-of-scope rather than claiming mitigation.  
**Owner:** QA + Security  
**Timeline:** Story 5.6  
**Status:** Planned  
**Verification:** `5.6-DOC-002`, `5.6-UNIT-003`

### E5-007: Audit/legal publication links are structurally weak

**Mitigation Strategy:** Test citation extraction, handoff contents, engagement trackers, and legal fallback rendering; do not fabricate vendor reports or overclaim legal conclusions.  
**Owner:** Andre + QA  
**Timeline:** Stories 5.8 and 5.9  
**Status:** Planned  
**Verification:** `5.8-UNIT-003`, `5.9-INT-003`, `5.9-DOC-001`

## Assumptions and Dependencies

1. Epic 5 starts after Epic 4 completion, matching the dependency graph's Epic 5 readiness note.
2. Surfpool is preferred for full-fidelity adversary execution; LiteSVM-style fallback can support smoke tests but not canonical Story 5.4 acceptance unless explicitly waived.
3. Vendor audit/legal delivery dates are outside direct test automation control; repo scaffolding must make readiness and fallback state explicit.
4. Documentation paths in the stories are path-locked and should not be renamed without updating PRD, architecture, epics, README consumers, and audit/legal handoff materials.

## Follow-on Workflows

- Run `bmad-testarch-atdd` for each Epic 5 story batch to generate red-phase P0 tests.
- Run `bmad-testarch-automate` after story implementation starts to expand P1/P2 automation.
- Run `bmad-testarch-trace` after Story 5.6 lands to verify threat-model and acceptance traceability.
- Run `bmad-testarch-test-review` on the proptest and adversary simulation suites before Epic 5 is marked done.

## Checklist Validation

- Epic-level mode selected from explicit Epic 5 + stories 5.1-5.9 scope.
- Story artifacts 5.1-5.9 loaded and each story is referenced in coverage.
- Dependency lanes validated against `output_susu/implementation-artifacts/dependency-graph.md`.
- PRD FR21-FR27, FR57, NFR-P4, NFR-P5, NFR-S1, NFR-S10, and NFR-Re1 included.
- Architecture paths for `tests/invariants/`, `crates/susu-adversary/`, `docs/`, and `audits/` included.
- Risks use TECH/SEC/PERF/DATA/BUS/OPS categories with probability, impact, score, mitigation, owner, and timeline for high risks.
- Coverage scenarios are story-by-story, risk-linked, prioritized, and avoid duplicating the same behavior across levels.
- Execution strategy uses simple PR / Nightly / Weekly/manual split and states the <15 minute PR principle.
- Resource estimates are ranges and avoid false precision.
- Quality gates include P0 100%, P1 >=95%, high-risk mitigation completion, and coverage targets.
- No sprint-status, story implementation, README, or source code changes were made by this workflow.

## Related Documents

- PRD: `output_susu/planning-artifacts/prd.md`
- Epic definitions: `output_susu/planning-artifacts/epics.md`
- Architecture: `output_susu/planning-artifacts/architecture.md`
- Dependency graph: `output_susu/implementation-artifacts/dependency-graph.md`

**Generated by:** BMad TEA Agent - Test Architect Module  
**Workflow:** `bmad-testarch-test-design`  
**Version:** 4.0 (BMad v6)
