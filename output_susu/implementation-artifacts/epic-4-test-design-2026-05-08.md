# Epic 4 Test Design - Permissionless Rotation & Payout Claim

Date: 2026-05-08  
Author: Dre / BMAD Test Architect  
Mode: Epic-level test design  
Status: Draft, local-only BAD output

## Scope

Epic 4 covers FR15-FR20: deterministic on-chain rotation-slot assignment, permissionless `claim_payout`, non-recipient rejection, pre-deadline rejection, double-claim rejection via `RotationReceipt`, and the no-scheduler full lifecycle assertion.

**Logical implementation order for tests:** `4.1` -> `4.2` -> parallel guard hardening for `4.3` and `4.5` after `4.2` -> `4.4` after `4.3` -> `4.6` capstone after `4.1`-`4.5` are merged. This matches `output_susu/implementation-artifacts/dependency-graph.md`.

Surfpool remains `LiteSVM-fallback` per `docs/surfpool-status.md` until Anchor/Surfpool binaries are available on a capable host. Program-level Epic 4 tests should run under Anchor/LiteSVM or bankrun first; Story 4.6 keeps Surfpool as the canonical integration target and should carry a clear environment blocker until the spike is upgraded from fallback.

## Inputs Loaded

- `output_susu/implementation-artifacts/4-1-rotation-slot-algorithm.md`
- `output_susu/implementation-artifacts/4-2-claim-payout.md`
- `output_susu/implementation-artifacts/4-3-non-recipient-guard.md`
- `output_susu/implementation-artifacts/4-4-pre-deadline-guard.md`
- `output_susu/implementation-artifacts/4-5-double-claim-guard.md`
- `output_susu/implementation-artifacts/4-6-e2e-lifecycle-test.md`
- `output_susu/implementation-artifacts/dependency-graph.md`
- `output_susu/implementation-artifacts/sprint-status.yaml`
- `output_susu/planning-artifacts/prd.md` (FR15-FR20, NFR-P1, NFR-P2, NFR-S2, NFR-C1)
- `output_susu/planning-artifacts/epics.md` (Epic 4 ACs and issue mapping)
- `output_susu/planning-artifacts/architecture.md` (PDA, checked math, permissionless model, project structure)
- `docs/surfpool-status.md`
- `_bmad/tea/config.yaml`
- Existing tests under `programs/susu/tests/`, `tests/atdd/`, `tests/fixtures/`, and `tests/invariants/`
- `.agents/skills/bmad-testarch-test-design/resources/knowledge/risk-governance.md`
- `.agents/skills/bmad-testarch-test-design/resources/knowledge/probability-impact.md`
- `.agents/skills/bmad-testarch-test-design/resources/knowledge/test-levels-framework.md`
- `.agents/skills/bmad-testarch-test-design/resources/knowledge/test-priorities-matrix.md`

## Acceptance Themes

1. **Replayable slot assignment:** `MemberPosition.rotation_slot` moves from `u8::MAX` to a bijection over `[0..n)` by a pure, deterministic hash-rank algorithm using only committed on-chain state.
2. **No off-chain randomness:** slot assignment does not read fresh clock, recent blockhash, environment variables, oracle state, keeper data, or client-supplied randomness at assignment time.
3. **Claim recipient integrity:** `claim_payout(group, i)` binds the signer to the `MemberPosition` PDA and rejects non-members, wrong-slot members, and PDA spoof attempts before receipt init or token transfer.
4. **Deadline integrity:** `claim_payout` uses Solana `Clock` with checked arithmetic and strict `clock > deadline` semantics; `deadline - 1` and `deadline` fail, `deadline + 1` succeeds.
5. **Receipt-as-proof:** `RotationReceipt` at `[ROTATION_SEED, group, rotation_index_le_bytes]` is the canonical one-shot payout proof; no runtime boolean may drift from PDA existence.
6. **Vault transfer safety:** payout amount is exactly `n * group.contribution_amount`, uses checked multiplication, transfers from the group vault PDA to the recipient token account, and never uses protocol-team authority.
7. **No scheduler dependency:** Epic 4 must prove payouts are pull-based signed transactions. The capstone lifecycle and static checks reject scheduler, keeper, cron, automation, executor, bot, Chainlink, or Clockwork-style dependencies.
8. **Capstone lifecycle:** the final Epic 4 test proves create -> invite -> accept -> collateralize -> start/assign -> contribute -> claim -> complete -> withdraw with no hard-coded slot recipient assumptions.

## Not in Scope

| Item | Reasoning | Mitigation |
| --- | --- | --- |
| Full no-strategic-default proptest and 10K adversary simulation | Epic 5 owns FR21-FR23. | Epic 4 verifies payout mechanics and lifecycle invariants; Epic 5 verifies incentive properties. |
| TS/Rust SDK polished `claimPayout` helpers | Epic 6 owns SDK surface and parity. | Program tests may use generated clients or local helpers only as harness code. |
| Reference-app one-tap claim UI | Epic 7 owns FR41 UI. | Epic 4 asserts protocol instruction semantics; UI consumes later. |
| Mainnet immutability and audit gates | Epic 9 and audit workflow own deploy gates. | Epic 4 keeps IDL/account-change discipline and checked math tests. |
| Surfpool execution on this host | Current repo status says Surfpool/Anchor binaries are unavailable. | Design Story 4.6 for Surfpool, but allow LiteSVM/bankrun inner-loop until tooling is installed and spike passes. |

## Risk Assessment

### High-Priority Risks

| Risk ID | Category | Description | P | I | Score | Mitigation | Owner | Timeline |
| --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |
| E4-001 | DATA | Slot assignment is not byte-replayable because it uses mutable ordering, fresh time, client input, or non-canonical seed bytes. | 2 | 3 | 6 | Determinism tests run assignment twice from identical state; static scan forbids fresh `Clock::get()` or env/random reads inside assignment; doc worked example is fixture-backed. | Dev + QA | Story 4.1 |
| E4-002 | SEC | Non-recipient or forged `MemberPosition` account can claim another member's rotation. | 2 | 3 | 6 | Anchor/LiteSVM negative tests for non-member, wrong-slot member, and malicious PDA collision; assert no receipt and vault unchanged on failure. | Dev + QA | Stories 4.2-4.3 |
| E4-003 | DATA | Double-claim prevention drifts from `RotationReceipt` PDA existence due to wrong seeds/endian or runtime flags. | 2 | 3 | 6 | Derive receipt PDA with `ROTATION_SEED` and `rotation_index.to_le_bytes()` only; double-claim and per-rotation isolation tests; no claimed boolean. | Dev + QA | Stories 4.2, 4.5 |
| E4-004 | TECH | Deadline arithmetic has off-by-one or overflow behavior, allowing early claims or blocking valid claims. | 2 | 3 | 6 | Boundary matrix at `deadline - 1`, `deadline`, `deadline + 1` for `n in {3,7,10}` and rotation `0`/`n-1`; checked add/mul static review. | Dev + QA | Story 4.4 |
| E4-005 | OPS | A scheduler/keeper/off-chain executor dependency sneaks into implementation or capstone harness, invalidating FR20. | 2 | 3 | 6 | Static forbidden-token check on lifecycle test and code paths; capstone asserts every transition is an explicit signed tx; review architecture imports. | QA + DevOps | Story 4.6 |

### Medium-Priority Risks

| Risk ID | Category | Description | P | I | Score | Mitigation | Owner |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| E4-006 | SEC | Vault transfer uses wrong authority, mint, destination owner, or amount calculation. | 2 | 2 | 4 | Happy-path token delta tests, wrong-recipient token-account negatives, FinCEN posture script on token CPI changes. | Dev + QA |
| E4-007 | OPS | Surfpool remains unavailable or flaky, delaying Story 4.6 acceptance. | 2 | 2 | 4 | Keep LiteSVM/bankrun equivalent lifecycle in PR; mark Surfpool as environment-blocked until spike passes; record exact command transcript when upgraded. | QA |
| E4-008 | PERF | Full lifecycle test exceeds the <30s capstone budget or program handlers exceed compute assumptions. | 2 | 2 | 4 | Time capstone with `Instant` or harness timing; log durations; keep n=5 capstone and put larger matrices in program-level tests. | Dev |
| E4-009 | DATA | Final rotation completion and collateral withdrawal do not coordinate, leaving funds stuck after all payouts. | 2 | 2 | 4 | Story 4.6 final assertions cover `Completed`, all receipts, all collateral withdrawn, and vault balance zero. | Dev + QA |
| E4-010 | TECH | Error precedence is unstable, making SDK error mapping brittle. | 2 | 2 | 4 | Tests assert wrong-recipient fails before deadline/receipt init where stories require it; document raw Anchor init error mapping for `AlreadyClaimed`. | Dev |

### Low-Priority Risks

| Risk ID | Category | Description | P | I | Score | Action |
| --- | --- | --- | ---: | ---: | ---: | --- |
| E4-011 | OPS | `msg!` event parsing differs across harness versions. | 1 | 2 | 2 | Prefer state and token assertions; logs are secondary. |
| E4-012 | DATA | `docs/rotation-assignment.md` worked example drifts from implementation. | 1 | 2 | 2 | Fixture-backed doc example and CI check when doc or algorithm changes. |
| E4-013 | PERF | Slot assignment sort cost is questioned. | 1 | 1 | 1 | n <= 12; include n=12 compute smoke if easy. |

## Coverage Plan

Priority reflects protocol risk and acceptance criticality, not execution timing. Run everything in PRs when the touched suite stays under 15 minutes; defer only Surfpool/full-environment validation when tooling is unavailable or expensive.

### Story 4.1 - Deterministic rotation-slot assignment

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 4.1-UNIT-001 | P0 | Rust unit / program | Pure hash-rank helper returns a byte-identical mapping for the same `(group_pda, members, slot_seed_nonce)` across repeated calls. | E4-001 |
| 4.1-INT-002 | P0 | Anchor/LiteSVM | Starting an all-collateralized group replaces every `u8::MAX` placeholder with exactly one slot in `[0..n)`. | E4-001 |
| 4.1-INT-003 | P0 | Anchor/LiteSVM | Bijection matrix for `n in {3,5,7,10,12}`: no gaps, no duplicate slots, all members assigned. | E4-001 |
| 4.1-UNIT-004 | P1 | Static/CI | Assignment routine contains no fresh `Clock::get()`, recent-blockhash, env, RNG, oracle, scheduler, or client-random input. | E4-001, E4-005 |
| 4.1-UNIT-005 | P1 | Rust unit | Same members and same seed on different group PDAs produce different mappings, proving group PDA domain separation. | E4-001 |
| 4.1-DOC-006 | P1 | Fixture/doc | `docs/rotation-assignment.md` worked example is generated or verified by a test fixture. | E4-012 |
| 4.1-INT-007 | P1 | Anchor/LiteSVM | `slots_assigned` message/event includes group and all `(member, slot)` pairs when harness supports log capture. | E4-011 |

### Story 4.2 - `claim_payout`

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 4.2-INT-001 | P0 | Anchor/LiteSVM | Happy path: 5-member Active group, rotation 0 closed, recipient claims; receipt exists with correct fields; recipient token balance increases by `5 * contribution_amount`; vault decreases by same. | E4-002, E4-006 |
| 4.2-INT-002 | P0 | Anchor/LiteSVM | Receipt PDA derives at `[ROTATION_SEED, group, rotation_index_le_bytes]` and stores `recipient`, `amount`, `claimed_at`, `rotation_index`, `group`, `bump`; no signature field is stored. | E4-003 |
| 4.2-INT-003 | P0 | Anchor/LiteSVM | `Group.status != Active` rejects with `GroupNotActive`; no receipt, no transfer. | E4-006 |
| 4.2-INT-004 | P0 | Anchor/LiteSVM | Payout amount overflow path maps to `ArithmeticOverflow`; no saturating math. | E4-004, E4-006 |
| 4.2-INT-005 | P1 | Anchor/LiteSVM | USDC and USDT mint fixtures use raw token units consistently; no human-decimal conversion inside handler. | E4-006 |
| 4.2-INT-006 | P1 | Log/state | `payout_claimed` message/event includes group, rotation, recipient, and amount where log capture is stable. | E4-011 |

### Story 4.3 - Non-recipient guard

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 4.3-INT-001 | P0 | Anchor/LiteSVM | Wrong-slot member calls `claim_payout(group, 0)` and fails with `NotRotationRecipient`; no receipt, vault unchanged. | E4-002 |
| 4.3-INT-002 | P0 | Anchor/LiteSVM | Non-member wallet without a valid `MemberPosition` PDA fails at Anchor account validation. | E4-002 |
| 4.3-INT-003 | P0 | Anchor/LiteSVM | Malicious PDA collision attempt cannot pass `seeds = [MEMBER_SEED, group, signer]`; failure occurs before handler transfer. | E4-002 |
| 4.3-INT-004 | P1 | Anchor/LiteSVM | Legitimate recipient still succeeds after negative tests use the same fixture family. | E4-002 |
| 4.3-INT-005 | P1 | Anchor/LiteSVM | Error precedence: wrong recipient fails before deadline and receipt-init checks. | E4-010 |

### Story 4.4 - Pre-deadline guard

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 4.4-INT-001 | P0 | Clock warp | At `deadline - 1`, recipient claim fails with `ContributionPeriodOpen`; no receipt, vault unchanged. | E4-004 |
| 4.4-INT-002 | P0 | Clock warp | At `deadline`, recipient claim still fails with `ContributionPeriodOpen`, proving strict `>` semantics. | E4-004 |
| 4.4-INT-003 | P0 | Clock warp | At `deadline + 1`, recipient claim succeeds and creates the receipt. | E4-004 |
| 4.4-INT-004 | P0 | Clock warp matrix | Repeat boundary cases for `n in {3,7,10}` and rotations `0` and `n-1`. | E4-004 |
| 4.4-UNIT-005 | P1 | Static/CI | Deadline computation uses `checked_mul` and `checked_add`; no `saturating_*`, wrapping math, or panic/assert. | E4-004 |

### Story 4.5 - Double-claim guard

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 4.5-INT-001 | P0 | Anchor/LiteSVM | Same recipient claims rotation 0 once successfully, then second call fails as `AlreadyClaimed` or documented Anchor init-on-existing-account mapping; vault unchanged after first claim. | E4-003 |
| 4.5-INT-002 | P0 | Anchor/LiteSVM | `RotationReceipt[0]` fields remain unchanged after failed second claim. | E4-003 |
| 4.5-INT-003 | P0 | Anchor/LiteSVM | Rotation 0 claimed does not block rotation 1; separate receipt PDAs prove per-rotation isolation. | E4-003 |
| 4.5-INT-004 | P1 | Anchor/LiteSVM | Different signer attempting to re-claim an already claimed rotation fails earlier as non-recipient; no second transfer. | E4-002, E4-003 |
| 4.5-DOC-005 | P1 | Docs/static | `docs/threat-model.md` or placeholder section documents receipt-existence-as-proof and references the double-claim test. | E4-003, E4-012 |

### Story 4.6 - Full lifecycle no-scheduler capstone

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 4.6-E2E-001 | P0 | Surfpool integration | 5-member lifecycle: create, invite, accept, post collateral, start/assign, all rotations contribute and claim, complete, withdraw. | E4-005, E4-009 |
| 4.6-E2E-002 | P0 | Surfpool integration | End state: all five `RotationReceipt` PDAs exist with correct recipients/amounts; all `MemberPosition.collateral_posted == 0`; vault balance is zero. | E4-003, E4-009 |
| 4.6-E2E-003 | P0 | Static/CI | `tests/integration/full_lifecycle.rs` contains no forbidden scheduler/keeper/cron/automation/executor/bot/Chainlink/Clockwork tokens except allowlisted explanatory comments if the check supports allowlists. | E4-005 |
| 4.6-E2E-004 | P0 | Surfpool integration | Assertions derive realized recipient from `rotation_slot`; no hard-coded `m0 == slot 0` assumptions. | E4-001 |
| 4.6-E2E-005 | P1 | Performance | Full lifecycle duration is logged and asserted under 30s on the supported Surfpool host. | E4-008 |
| 4.6-DOC-006 | P1 | Docs/static | `tests/coverage/threat-model.md` records FR20 coverage and references the capstone plus forbidden-token check. | E4-005 |
| 4.6-FALLBACK-007 | P1 | Anchor/LiteSVM/bankrun | Until Surfpool is available, run an equivalent LiteSVM/bankrun lifecycle smoke without claiming Story 4.6 Surfpool acceptance complete. | E4-007 |

## Execution Strategy

**PR (every Epic 4 touching PR):**

- Run program tests for touched stories under Anchor/LiteSVM or bankrun, including all P0 and practical P1 scenarios for the changed handler.
- Run static checks for PDA seed discipline, checked arithmetic, forbidden scheduler tokens, no inline seed literals, and no `saturating_*` / `wrapping_*` math where Epic 4 code changes.
- Run IDL hash/parity checks whenever account or instruction shapes change.
- Run `scripts/check-fincen-posture.sh` when payout/vault/token CPI code changes.
- If the full touched suite remains under 15 minutes, run it in PR. Defer only Surfpool or long environment-dependent checks.

**Nightly or manual:**

- Story 4.6 Surfpool full lifecycle on a host with Surfpool, Anchor, and matching Solana tooling installed.
- Duration trend for capstone lifecycle and compute-budget observation for slot assignment and claim paths.
- Cross-epic smoke after Epic 4 lands: Epic 3 collateral lifecycle plus Epic 4 claims plus Epic 3 withdraw terminal path.

## Resource Estimates

| Priority | Scenario Count (approx.) | Estimated Effort | Notes |
| --- | ---: | --- | --- |
| P0 | 31 | ~36-56 h | Fixture setup, token deltas, PDA negatives, clock boundaries, lifecycle invariants. |
| P1 | 17 | ~16-30 h | Logs, docs/static checks, USDT fixture, performance timing, fallback lifecycle. |
| P2/P3 | 0 | ~0-4 h | No separate low-priority Epic 4 suite identified yet. |
| Total | 48 | ~52-90 h | Excludes Epic 5 adversary/property tests and Epic 7 UI claim flow. |

## Entry Criteria

- Epic 3 is complete and merged through `3.8-all-collateralized-gate`.
- `output_susu/implementation-artifacts/dependency-graph.md` marks Story 4.1 as the first unblocked Epic 4 story.
- Program account model includes `Group`, `MemberPosition`, vault PDA, contribution history, and terminal statuses from Epics 2-3.
- LiteSVM/bankrun or equivalent local program-test harness is available for PR checks.
- Surfpool acceptance for Story 4.6 is explicitly environment-gated until `docs/surfpool-status.md` is upgraded from `LiteSVM-fallback`.

## Exit Criteria

- P0 tests pass at 100%.
- P1 tests pass at >=95%, or failures have waiver with owner, date, and explicit residual risk.
- No unmitigated score >=6 risk remains before Epic 4 is marked done.
- Every acceptance criterion in Stories 4.1-4.6 maps to at least one test or an explicit environment blocker.
- FR20 is proven by both structural capstone behavior and static no-scheduler checks before Epic 4 is called complete.
- Story 4.6 cannot be marked fully accepted on Surfpool until the Surfpool spike is green on a supported host.

## Epic 4 Readiness

Ready for Story 4.1 from a test-design perspective. The first development story should start with deterministic assignment goldens, bijection/property-style tests for supported `n`, static no-randomness checks, and a fixture-backed `docs/rotation-assignment.md` example. Story 4.2 should not begin until the slot assignment path is merged or available on its story branch.

## Checklist Validation

- Epic-level mode selected from explicit Epic 4 + story scope (4.1-4.6).
- PRD, epics, architecture, story artifacts, dependency graph, Surfpool status, TEA config, prior Epic 2/3 designs, and existing tests loaded.
- Risks use TECH/SEC/PERF/DATA/BUS/OPS categories with probability, impact, score, mitigation, owner, and timeline where high.
- Coverage is story-by-story, risk-linked, prioritized, and avoids duplicating the same behavior across test levels.
- Execution strategy is a simple PR vs nightly/manual split and states the <15 minute PR principle.
- Estimates are ranges, not exact calculations.
- Sprint status reviewed; no status mutation made because this branch is test design only and Story 4 implementation has not started.
- Output written to `output_susu/implementation-artifacts/` per established BAD pattern.
