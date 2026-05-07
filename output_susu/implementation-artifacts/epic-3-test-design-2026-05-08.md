# Epic 3 Test Design — Curve Module, Contributions & Collateral Lifecycle

Date: 2026-05-08  
Author: Dre / BMAD Test Architect  
Mode: Epic-level test design  
Status: Draft, local-only BAD output

## Scope

Epic 3 covers FR4 and FR8–FR14: dynamic-collateral curve math, PDA vault custody, posting and topping up collateral, scheduled contributions within time windows, permissionless slashing and group-start cranks, and collateral withdrawal after terminal group states. It assumes Epic 2 is complete through Story 2.6 and builds on the pinned preflight program and frozen IDL discipline from Epic 1.

**Logical implementation order for tests (align with story acceptance criteria, not only graph row order):** `3.1` (pure curve) → `3.3` (vault init in `create_group`) → `3.2` (`post_collateral` into vault) → parallel tracks for `3.4`–`3.7` as handlers land → `3.8` (capstone gate) depends on `3.4` per dependency graph and gates `Forming` → `Active`.

Surfpool remains `LiteSVM-fallback` per `docs/surfpool-status.md` until Anchor/Surfpool tooling is validated on a capable host. Instruction-level tests for Epic 3 should run as Anchor/LiteSVM (or `bankrun`) tests with **clock sysvar manipulation** for window and grace-period scenarios.

## Inputs Loaded

- `output_susu/implementation-artifacts/3-1-curve-module.md`
- `output_susu/implementation-artifacts/3-2-post-collateral.md`
- `output_susu/implementation-artifacts/3-3-pda-vault-init.md`
- `output_susu/implementation-artifacts/3-4-contribute.md`
- `output_susu/implementation-artifacts/3-5-top-up-collateral.md`
- `output_susu/implementation-artifacts/3-6-slash-member.md`
- `output_susu/implementation-artifacts/3-7-withdraw-collateral.md`
- `output_susu/implementation-artifacts/3-8-all-collateralized-gate.md`
- `output_susu/implementation-artifacts/dependency-graph.md`
- `output_susu/planning-artifacts/prd.md` (FR4, FR8–FR14, NFR-P1, NFR-C1, NFR-S2)
- `output_susu/planning-artifacts/architecture.md` (vault PDAs, checked math, FinCEN posture)
- `docs/surfpool-status.md`
- `_bmad/tea/config.yaml`

## Acceptance Themes

1. **Canonical curve math:** `curve::calculate_collateral` is the only on-chain curve implementation; checked arithmetic only; `CurveOverflow` / `InvalidCurveParams` on failure; golden vectors and `tests/fixtures/curve-golden.json` locked for cross-language parity (TS parity exercised in later SDK work).
2. **Vault integrity:** Vault at `[VAULT_SEED, group]`; mint matches `group.mint`; authority is the **group PDA**, never a user or protocol key; FinCEN static check rejects non-PDA vault authorities.
3. **Collateral posting:** `post_collateral` uses curve requirement vs `rotation_slot`; SPL transfer member → vault; `collateral_posted` updated with checked add; insufficient amount → `InsufficientCollateral`.
4. **Contribution windowing:** Only `Active` groups; contribution history prevents double pay; clock-gated `OutsideContributionWindow`; inclusive boundary semantics for open/close.
5. **Top-up after membership change:** `top_up_collateral` recomputes against current `group.n` and mint decimals; tests may simulate dropout state until Epic 4 dropout instruction exists.
6. **Permissionless enforcement:** `slash_member` and `start_contributions` impose **no** privilege on the caller signer beyond paying fees; slashing respects grace closure and distribution conservation.
7. **Withdrawal terminal rules:** Withdraw only for `Completed` or `Cancelled`; slashed members forfeit (`CollateralForfeited`); zero `collateral_posted` after success to block double-withdraw.
8. **All-collateralized gate (FR4):** `start_contributions` validates all `n` positions, full slot coverage in `remaining_accounts`, per-member `collateral_posted >= required`, then sets `Active` and `start_timestamp`.

## Not in Scope

| Item | Reasoning | Mitigation |
| --- | --- | --- |
| Full `no_strategic_default` proptest + adversary 10K runs | Epic 5 owns FR21–FR23 artifacts. | Epic 3 uses deterministic goldens and one medium-scale slash scenario; defer property tests to Epic 5. |
| Formal `docs/collateral-curve.md` proof write-up | Story 5.5. | PR review ties code to interim spec; doc cites tests when landed. |
| Dropout / rotation assignment / `claim_payout` | Epic 4. | Tests use direct state fixtures or commented test doubles for `group.n` and terminal `Completed`. |
| TS SDK `curve.ts` parity CI | Epic 5 / 6. | JSON golden fixture is the contract; Rust tests own Epic 3 acceptance. |
| Live Surfpool fork validation | Tooling not proven in-repo. | LiteSVM/bankrun first; Surfpool smoke later. |

## Risk Assessment

### High-Priority Risks

| Risk ID | Category | Description | P | I | Score | Mitigation | Owner | Timeline |
| --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |
| E3-001 | DATA | Curve or vault PDA derivation drifts between Rust, tests, and clients. | 2 | 3 | 6 | Assert derivations in TS tests and Rust tests; forbid inline seed literals; IDL stability checks when account shapes change. | Dev + QA | Each story |
| E3-002 | SEC | Missing signer, mint, or authority checks allow draining vault or spoofing positions. | 2 | 3 | 6 | Negative LiteSVM tests for wrong mint, non-member signer, vault not PDA; CPI tests with wrong authorities. | Dev + QA | 3.2–3.7 |
| E3-003 | DATA | Checked math omitted on timestamps, amounts, or collateral balances → silent wrap or panic. | 2 | 3 | 6 | Grep/review for `checked_*`; tests for overflow paths; `cargo deny` no saturating policy. | Dev | 3.1, 3.4–3.6 |
| E3-004 | TECH | `remaining_accounts` ordering or slot gaps in `slash_member` / `start_contributions` allow accounting bypass. | 2 | 3 | 6 | Explicit tests for wrong length, duplicate slots, missing slot; reject malformed lists. | Dev + QA | 3.6, 3.8 |

### Medium-Priority Risks

| Risk ID | Category | Description | P | I | Score | Mitigation | Owner |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| E3-005 | TECH | Clock warp / boundary errors on contribution or grace windows (`±1s`). | 2 | 2 | 4 | Dedicated boundary tests at `window_open`, `window_close`, grace end; document inclusive semantics. | QA |
| E3-006 | BUS | Slashing distribution dust or rounding disagrees with off-chain verifier. | 2 | 2 | 4 | Conservation sum tests + documented rounding; align with future doc in Story 5.5. | PM + Dev |
| E3-007 | OPS | FinCEN posture script false positives/negatives block CI. | 2 | 2 | 4 | Controlled violation fixture in script test harness; keep script narrow to token `init` authorities. | DevOps |

### Low-Priority Risks

| Risk ID | Category | Description | P | I | Score | Action |
| --- | --- | --- | ---: | ---: | ---: | --- |
| E3-008 | OPS | `msg!` parsing fragility across harness versions. | 1 | 2 | 2 | Prefer state assertions first; logs as secondary. |
| E3-009 | PERF | Large `remaining_accounts` bundles approach tx size limits. | 1 | 1 | 1 | n ≤ 12 by design; monitor account metas in slash tests. |

## Coverage Plan

Priority reflects risk and protocol safety, not necessarily story merge order.

### Story 3.1 — Closed-form curve module

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 3.1-UNIT-001 | P0 | Rust unit | `calculate_collateral` returns exact goldens for n ∈ {3, 5, 7, 10, 12}, multiple decimals incl. USDC/USDT 6-dec and synthetic 9-dec. | E3-001 |
| 3.1-UNIT-002 | P0 | Rust unit | `n` outside [3,12] or `slot >= n` → `InvalidCurveParams`. | E3-001 |
| 3.1-UNIT-003 | P0 | Rust unit | Forced overflow path → `CurveOverflow` (no `saturating_*`). | E3-003 |
| 3.1-UNIT-004 | P1 | Static/CI | `cargo deny` / grep: no `saturating_*` or `wrapping_*` in `curve.rs`. | E3-003 |
| 3.1-UNIT-005 | P1 | Fixture | `tests/fixtures/curve-golden.json` parses and matches Rust goldens. | E3-001 |
| 3.1-UNIT-006 | P1 | Performance | `cargo test -p susu curve` completes &lt;1s on CI class runner. | E3-009 |

### Story 3.2 — `post_collateral`

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 3.2-INT-001 | P0 | Anchor/LiteSVM | Happy path: n=5, slot=2, exact required transferred; `collateral_posted` increases; vault delta = amount. | E3-002 |
| 3.2-INT-002 | P0 | Anchor/LiteSVM | `amount = required - 1` → `InsufficientCollateral`. | E3-002 |
| 3.2-INT-003 | P0 | Anchor/LiteSVM | Wrong mint token account vs `group.mint` → constraint failure. | E3-002 |
| 3.2-INT-004 | P1 | Anchor/LiteSVM | Over-post succeeds; cumulative `collateral_posted` correct. | E3-002 |
| 3.2-INT-005 | P1 | Log/state | `msg!` / event payload includes member and amount when harness supports log scrape. | E3-008 |

### Story 3.3 — PDA vault init (`create_group` extension)

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 3.3-INT-001 | P0 | Anchor/LiteSVM | After `create_group`, vault PDA matches TS-derived address; mint and authority = group PDA. | E3-001 |
| 3.3-INT-002 | P0 | Integration | Post collateral → vault balance increases by exact token amount. | E3-002 |
| 3.3-INT-003 | P1 | Script/CI | `scripts/check-fincen-posture.sh` passes on clean tree; optional negative fixture proves failure detects non-PDA authority (reverted before merge). | E3-007 |

### Story 3.4 — `contribute`

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 3.4-INT-001 | P0 | Anchor/LiteSVM | Active group, in-window contribute; vault += `contribution_amount`; history slot `Contributed` with timestamp. | E3-002 |
| 3.4-INT-002 | P0 | Anchor/LiteSVM | `Forming` or non-Active → `GroupNotActive`. | E3-002 |
| 3.4-INT-003 | P0 | Clock warp | 1s before window → `OutsideContributionWindow`. | E3-005 |
| 3.4-INT-004 | P0 | Clock warp | 1s after window → `OutsideContributionWindow`. | E3-005 |
| 3.4-INT-005 | P0 | Anchor/LiteSVM | Second contribute same rotation → `AlreadyContributed`. | E3-002 |
| 3.4-INT-006 | P1 | Clock warp | Exact `window_open` and `window_close` inclusive success. | E3-005 |

### Story 3.5 — `top_up_collateral`

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 3.5-INT-001 | P0 | Anchor/LiteSVM | Simulated post-dropout `group.n`; top-up meets new `required` → success. | E3-001 |
| 3.5-INT-002 | P0 | Anchor/LiteSVM | Top-up below required delta → `InsufficientCollateral`. | E3-002 |
| 3.5-INT-003 | P1 | Anchor/LiteSVM | Distribution interaction placeholder: document dependency on 3.6 accounting when dropout path is real. | E3-006 |

### Story 3.6 — `slash_member`

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 3.6-INT-001 | P0 | Anchor/LiteSVM | Grace closed, not contributed → slash; `slash_status` = Slashed; sum distributed equals slashed amount (conservation). | E3-002 |
| 3.6-INT-002 | P0 | Anchor/LiteSVM | Within grace → `WithinGracePeriod`. | E3-005 |
| 3.6-INT-003 | P0 | Anchor/LiteSVM | Double slash → `AlreadySlashed`. | E3-002 |
| 3.6-INT-004 | P0 | Anchor/LiteSVM | Non-member caller can invoke (permissionless crank). | E3-002 |
| 3.6-INT-005 | P1 | Anchor/LiteSVM | Reduced “30% cartel” scenario: n=10, three defectors; honest receipts and vault conservation. | E3-006 |
| 3.6-INT-006 | P1 | Negative | Malformed `remaining_accounts` (wrong pairs / order) → safe failure. | E3-004 |

### Story 3.7 — `withdraw_collateral`

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 3.7-INT-001 | P0 | Anchor/LiteSVM | `Completed`: full withdraw; `collateral_posted` → 0; vault decreases correctly. | E3-002 |
| 3.7-INT-002 | P0 | Anchor/LiteSVM | `Cancelled` (from `cancel_group`) path succeeds. | E3-002 |
| 3.7-INT-003 | P0 | Anchor/LiteSVM | `Active` / `Forming` → `GroupNotCompleted`. | E3-002 |
| 3.7-INT-004 | P0 | Anchor/LiteSVM | Second withdraw → `CollateralAlreadyWithdrawn`. | E3-002 |
| 3.7-INT-005 | P0 | Anchor/LiteSVM | `slash_status == Slashed` → `CollateralForfeited`. | E3-002 |

### Story 3.8 — `start_contributions` (all-collateralized gate)

| Test ID | Priority | Level | Scenario | Risk Link |
| --- | --- | --- | --- | --- |
| 3.8-INT-001 | P0 | Anchor/LiteSVM | All members ≥ required → `Active`, `start_timestamp` set from clock. | E3-001 |
| 3.8-INT-002 | P0 | Anchor/LiteSVM | One member under-required → `NotAllCollateralized`. | E3-004 |
| 3.8-INT-003 | P1 | Anchor/LiteSVM | Last member finishes posting; subsequent crank succeeds (late joiner). | E3-004 |
| 3.8-INT-004 | P0 | Anchor/LiteSVM | Non-member caller succeeds when preconditions hold (permissionless). | E3-002 |
| 3.8-INT-005 | P1 | Cross | After start, `contribute` for rotation 0 in window succeeds; double `start` on `Active` fails. | E3-004 |
| 3.8-INT-006 | P1 | Negative | Wrong number of `remaining_accounts` or slot duplication → reject. | E3-004 |

## Execution Strategy

**PR (every Epic 3 touching PR):**

- Run `cargo test` for program package including curve goldens and new instruction tests.
- Run Anchor/LiteSVM (or `bankrun`) TS tests for touched instructions; clock-dependent cases must use warp helpers.
- Run extended static checks: IDL hash when accounts/instructions change; `check-fincen-posture.sh` when vault or token inits change.

**Nightly or manual:**

- Full Epic 3 scenario chain: create → vault → post (all members) → `start_contributions` → `contribute` → slash path → withdraw.
- Surfpool validation when spike is upgraded from `LiteSVM-fallback`.

## Resource Estimates

| Priority | Scenario Count (approx.) | Estimated Effort | Notes |
| --- | ---: | --- | --- |
| P0 | 35 | ~40–60 h | Clock warps, CPI setups, remaining-account edge cases. |
| P1 | 18 | ~16–28 h | Logs, script harness, cross-instruction flows. |
| Total | 53 | ~56–88 h | Excludes Epic 5 property/adversary work. |

## Entry Criteria

- Epic 2 stories through 2.6 merged; group/member account model stable.
- Story 3.1 is first dev-ready curve dependency for collateral features.
- LiteSVM/bankrun harness available locally or in CI for Solana program tests.

## Exit Criteria

- P0 tests pass at 100%.
- P1 tests pass at ≥95%, or failures have waiver with owner and date.
- No unmitigated score ≥6 risk remains before Epic 3 is marked done.
- Every acceptance criterion in Stories 3.1–3.8 maps to at least one test or an explicit deferred note in **Not in Scope**.
- FR4 gate is proven by `start_contributions` tests plus integration with `contribute`.

## Epic 3 Readiness

Ready for Story 3.1 from a test-design perspective: land pure curve goldens and overflow/params negatives first, then vault + token paths, then permissionless cranks and time-window logic.

## Checklist Validation

- Epic-level mode selected from explicit Epic 3 + story scope (3.1–3.8).
- PRD, architecture, story artifacts, dependency graph, Surfpool status, TEA config loaded; `project-context.md` glob had no matches (skipped).
- Risks use TECH/SEC/DATA/BUS/OPS categories with probability, impact, score, mitigation, owner, and timeline where high.
- Coverage is story-by-story, risk-linked, prioritized; Epic 4/5 deferrals explicit.
- Execution strategy separates PR vs nightly/manual.
- Output written to `output_susu/implementation-artifacts/` per established BAD pattern.
