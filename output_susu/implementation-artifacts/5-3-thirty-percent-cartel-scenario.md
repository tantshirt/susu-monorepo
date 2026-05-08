# Story 5.3: 30% Cartel scenario named as headline test (FR23)

Status: review

## Story

As an auditor or judge,
I want the "30% Cartel" scenario (10-member circle, members 4-6 collude and default simultaneously after member 3's payout) implemented as a named module in `susu-adversary` and called out in the README headline,
So that the named falsification target is structural and any challenger has a single explicit attack vector to reproduce and probe.

## Acceptance Criteria

1. **Given** the adversary skeleton from Story 5.2, **when** the 30% Cartel scenario module lands at `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs`, **then** the scenario sets up a 10-member circle, executes contributions through rotation 3 (member 3 receives payout), then has members 4-6 simultaneously default.
2. The scenario asserts: honest members (0-3, 7-9) are made whole from defectors' collateral; defectors (4-6) net negative; no admin intervention occurs.
3. The scenario is run as part of `susu-adversary` invocations and is named in the JSON report's `scenarios_covered` list.
4. The README.md (Epic 8) calls out "30% Cartel" by name in the badge cluster's adversary link.
5. Unit tests cover the scenario's setup correctness independent of the full adversary run.

## Tasks / Subtasks

- [x] Create scenario module (AC: 1, 2)
  - [x] `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs` exporting `pub fn run(rng: &mut ChaCha20Rng, ctx: &mut SimulatorContext) -> ScenarioResult`
  - [x] Setup: 10 members, fixed contribution (e.g., $100 USDC), USDC mint, rotation order 0->9
  - [x] Drive lifecycle: members 0-3 contribute through rotations 0-3 inclusive; member 3 claims rotation-3 payout
  - [x] Execute synchronized default by members 4, 5, 6 at rotation 4 (they fail to contribute on the deadline)
  - [x] Continue lifecycle through `settle_default` for slots 4, 5, 6: their collateral is seized, distributed to honest members
  - [x] Capture per-member final balance: contributions, payouts received, collateral seized, net P&L
- [x] Assertions (AC: 2)
  - [x] `assert!(honest_members.all(|m| m.net_pnl >= 0), "honest member made worse off")` - zero-loss invariant for honest members
  - [x] `assert!(defectors.all(|d| d.net_pnl < 0), "defector profited - Curve Invariant violated")`
  - [x] `assert_eq!(admin_intervention_count, 0, "scenario required admin action - protocol non-autonomous")`
- [x] Register scenario in scenarios index (AC: 3)
  - [x] `crates/susu-adversary/src/scenarios/mod.rs` exposes a `pub fn all_scenarios() -> Vec<Scenario>` that includes `thirty_percent_cartel`
  - [x] The simulator main loop iterates `all_scenarios()` and executes each, adding the name to `scenarios_covered`
  - [x] JSON report `summary.scenarios_covered` includes `"30_percent_cartel"` literally
- [x] README hook (AC: 4) - placeholder for Epic 8
  - [x] Add a TODO comment in `crates/susu-adversary/README.md`: "Epic 8 / Story 8.x must add a `30% Cartel` link in the root README badge cluster pointing to this scenario file."
  - [x] No actual root README edit in this story - Epic 8 owns the README.
- [x] Unit tests (AC: 5)
  - [x] `crates/susu-adversary/tests/thirty_percent_cartel.rs` - exercises setup-only paths (group init, member registration, contribution to rotation 3) and asserts the in-memory state is correct, *without* the default phase
  - [x] Separate test asserts the assertion macros fire correctly when fed a synthetic "defector profited" state (sanity check that the test's positive assertion isn't accidentally trivially true)

## Dev Notes

### Architecture compliance (non-negotiables)

- **Path lock:** `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs` - exactly this filename, exactly this module name. The README will link this exact path. The audit firm will cite this exact path. Renaming requires updating the README, the audit communications, and the `scenarios_covered` string.
- **Naming convention:** scenario module file = `thirty_percent_cartel.rs` (snake_case); JSON `scenarios_covered` entry = `"30_percent_cartel"` (kebab-y but starts with digit-allowed). Document the divergence in the file's doc-comment.
- **Headline status:** This is *the* named falsification target. The PRD's User Success criterion includes "passes external review by a developer outside cryptoeconomics" - that reviewer reads the README, clicks "30% Cartel," and lands at this file. The first paragraph of the file's doc-comment must be self-contained: explain what the scenario tests, why "30%" matters (under-1/3 of an n=10 circle = 3 members), and why simultaneous default at slot 4 is the worst-case attack vector.
- **No admin intervention:** the scenario fails the "no_admin_intervention_count == 0" assertion if any helper invokes a hypothetical admin instruction. The protocol has no admin instructions (per architecture's no-admin-keys mandate); this assertion is a tripwire against future drift.

### Source tree to create

```text
crates/susu-adversary/src/scenarios/
|- mod.rs                                    # Updated: registers thirty_percent_cartel
`- thirty_percent_cartel.rs                  # NEW - this story
crates/susu-adversary/tests/
`- thirty_percent_cartel.rs                  # NEW - unit-level setup test
```

### Project Structure Notes

- The 30% Cartel is the *first* named scenario; future scenarios (50% cartel, late-position single-defector, etc.) follow the same module template. The `mod.rs` registry pattern is what makes adding scenarios cheap.
- Doc-comment on the scenario function MUST include: (a) one-line summary, (b) member-index -> role mapping (0-3 honest early, 4-6 defector cartel, 7-9 honest late), (c) expected outcome ("honest net >= 0; defector net < 0; admin actions = 0").
- The `ScenarioResult` struct must include enough detail for the JSON report to render the per-scenario block - specifically `max_defector_profit_lamports` (must be <= 0), and per-defector loss values for legibility.

### Forbidden patterns

- Do NOT make the scenario non-deterministic. The `&mut ChaCha20Rng` is the only randomness source; the scenario itself is structurally fixed (10 members, slots 4-6 default), so randomness is limited to wallet keypair generation seeded from RNG.
- Do NOT short-circuit the lifecycle. Every contribution, every claim, every settle_default must hit the deployed program - no in-memory shortcuts. The point is to exercise the *real* on-chain logic.
- Do NOT add admin-style helpers ("force_settle", "manual_distribution"). If the scenario can't complete without one, it's a finding, not a workaround.
- Do NOT rely on wall-clock for deadline enforcement - the scenario must drive Solana clock via Surfpool's `set_clock` so the deadline trigger is deterministic.

### Testing standards

- The unit test in `crates/susu-adversary/tests/thirty_percent_cartel.rs` should run in <30s (no full simulator spin-up).
- The full scenario runs as part of `cargo run --bin susu-adversary --` in Stories 5.2/5.4.
- Sanity injection: temporarily seed a "defector got 1 lamport profit" state and confirm the scenario's assertion fails - guards against assertion-trivially-true regressions.

### ATDD Artifacts

- Checklist: `output_susu/test-artifacts/atdd-checklist-5-3-thirty-percent-cartel-scenario.md`
- BDD scenarios: `tests/atdd/story-5-3-thirty-percent-cartel-scenario.atdd.md`
- Static red test: `tests/atdd/story-5-3-thirty-percent-cartel-scenario.static.red.test.mjs`

### References

- [epics.md §Epic 5 / Story 5.3](output_susu/planning-artifacts/epics.md) - full BDD ACs
- [architecture.md §Adversary simulator boundary](output_susu/planning-artifacts/architecture.md) - line 1052
- [architecture.md §Core Architectural Decisions](output_susu/planning-artifacts/architecture.md) - Curve Invariant, no admin keys
- [prd.md §FR23](output_susu/planning-artifacts/prd.md) - 30% Cartel as named scenario
- [prd.md §User Success](output_susu/planning-artifacts/prd.md) - external-developer comprehension criterion

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `node --test tests/atdd/story-5-3-thirty-percent-cartel-scenario.static.red.test.mjs` failed in red phase before implementation with missing scenario module, registry wiring, README hook, and unit test.
- `node --test tests/atdd/story-5-3-thirty-percent-cartel-scenario.static.red.test.mjs` passed after implementation: 4 tests.
- `cargo test --package susu-adversary` passed after implementation: 10 tests.
- `cargo test --workspace` passed after implementation.
- `pnpm test:atdd` initially hit the existing Story 2.1 parity command timeout while the workspace was cold; `bash scripts/check-sdk-parity.sh` passed standalone and the full `pnpm test:atdd` rerun passed: 137 tests.
- Code review found the report projection omitted per-defector net P&L values; `cargo test --package susu-adversary` and targeted ATDD tests passed after the fix.

### Completion Notes List

- Added `susu-adversary` library exports so scenario modules can be tested directly without invoking the binary.
- Implemented `thirty_percent_cartel` as the first named scenario with a fixed 10-member setup, members 4-6 as the synchronized default cartel, contribution progress through rotation 3, and zero-admin settlement assertions.
- Registered `"30_percent_cartel"` in the scenario registry and wired `run_simulation` to include registered scenario results in `summary.scenarios_covered` and `per_scenario_results`.
- Added the Epic 8 README handoff TODO and scenario-specific integration tests, including setup verification and a synthetic defector-profit assertion failure.
- Addressed code review by carrying `defector_net_pnl_lamports` from `ScenarioResult` into `PerScenarioResult` for report legibility.

### File List

- `crates/susu-adversary/README.md`
- `crates/susu-adversary/src/lib.rs`
- `crates/susu-adversary/src/main.rs`
- `crates/susu-adversary/src/report.rs`
- `crates/susu-adversary/src/scenarios/mod.rs`
- `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs`
- `crates/susu-adversary/src/simulator.rs`
- `crates/susu-adversary/tests/thirty_percent_cartel.rs`
- `output_susu/implementation-artifacts/5-3-thirty-percent-cartel-scenario.md`
- `output_susu/implementation-artifacts/sprint-status.yaml`
- `output_susu/test-artifacts/atdd-checklist-5-3-thirty-percent-cartel-scenario.md`
- `tests/atdd/story-5-3-thirty-percent-cartel-scenario.atdd.md`
- `tests/atdd/story-5-3-thirty-percent-cartel-scenario.static.red.test.mjs`

### Change Log

- 2026-05-08: Added ATDD red artifacts for Story 5.3.
- 2026-05-08: Implemented the named 30% Cartel scenario, registry/report wiring, README handoff, and scenario tests; marked story ready for review.
- 2026-05-08: Addressed code review finding by adding per-defector net P&L values to the per-scenario report projection.
