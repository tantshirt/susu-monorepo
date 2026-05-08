# Story 5.2: susu-adversary CLI binary skeleton (FR22 part 1)

Status: ready-for-dev

## Story

As an auditor or judge,
I want a `crates/susu-adversary/` binary invokable as `cargo run --bin susu-adversary -- --circles 10000 --seed $COMMIT_SHA` that runs N randomized ROSCA lifecycles and emits a structured JSON report,
So that the protocol's central novelty claim is reproducible from a clean clone with one command.

## Acceptance Criteria

1. **Given** the program from Epics 2–4 deployed to devnet, **when** `cargo run --bin susu-adversary -- --circles 10000 --seed <hex>` runs, **then** the binary parses CLI args (`--circles`, `--seed`, `--cluster`).
2. It constructs a deterministic RNG seeded from `--seed`.
3. It runs 10,000 randomized lifecycles (varying n, contribution, defection patterns) against the deployed program ID via Surfpool fork.
4. It emits a JSON report at `audits/adversary/adversary-report.json` with: `run_metadata` (seed, commit_sha, circles, started_at, finished_at), `summary` (total_runs, max_defector_profit_lamports, scenarios_covered), `per_scenario_results` array.
5. The binary exits 0 if `max_defector_profit_lamports == 0`, else exits 1.
6. The binary's source includes a `README.md` explaining `--seed $COMMIT_SHA` reproducibility and how to interpret the report.

## Tasks / Subtasks

- [ ] Scaffold `crates/susu-adversary/` Cargo crate (AC: 1)
  - [ ] `crates/susu-adversary/Cargo.toml` with `[[bin]] name = "susu-adversary"` and deps: `clap` (CLI), `rand_chacha` (deterministic RNG), `serde_json`, `solana-sdk`, `litesvm` or `surfpool` client, the program's IDL via `sdk/rust`
  - [ ] Add `crates/susu-adversary` as workspace member in root `Cargo.toml` (already done in Story 1.1 skeleton)
  - [ ] `crates/susu-adversary/src/main.rs` — CLI entrypoint
  - [ ] `crates/susu-adversary/src/simulator.rs` — lifecycle harness
  - [ ] `crates/susu-adversary/src/scenarios/mod.rs` — scenario module index (empty; Story 5.3 adds 30% Cartel)
  - [ ] `crates/susu-adversary/src/report.rs` — JSON report struct definitions
- [ ] CLI argument parsing (AC: 1)
  - [ ] Use `clap` derive: `--circles u32` (default 10_000), `--seed String` (hex; required), `--cluster String` (default "localnet" → Surfpool fork)
  - [ ] Validate `--seed` is valid hex of length 64 (32 bytes). Reject otherwise.
- [ ] Deterministic RNG construction (AC: 2)
  - [ ] Use `rand_chacha::ChaCha20Rng::from_seed(seed_bytes)` — NOT `thread_rng()`, NOT `OsRng`
  - [ ] Pass the RNG handle by `&mut` into every randomized helper; never reseed mid-run
- [ ] Lifecycle harness (AC: 3)
  - [ ] Surfpool fork: spin a fresh validator in-process; deploy the frozen program; run a randomized lifecycle (init group, members join, contribute, optional default, claim, settle/recover)
  - [ ] Per lifecycle: sample `n ∈ [3, 12]`, `contribution ∈ [$10, $10K]`, defection pattern (none / single / cartel — Story 5.3 names the 30% Cartel pattern explicitly)
  - [ ] Capture: defector net change (claimed − contributed − collateral burned), honest payouts received, group final state
- [ ] JSON report emission (AC: 4)
  - [ ] Define `RunMetadata { seed, commit_sha, circles, started_at, finished_at }`, `Summary { total_runs, max_defector_profit_lamports, scenarios_covered }`, `PerScenarioResult { name, runs, max_defector_profit, ... }`
  - [ ] Write to `audits/adversary/adversary-report.json` with `serde_json::to_writer_pretty` and trailing newline
  - [ ] `commit_sha` populated from `GIT_COMMIT_SHA` env var or fallback to `git rev-parse HEAD` at build time via `build.rs`
- [ ] Exit code (AC: 5)
  - [ ] If `max_defector_profit_lamports == 0` → exit 0
  - [ ] Else → exit 1 with stderr message naming the worst scenario + counterexample
- [ ] `crates/susu-adversary/README.md` (AC: 6)
  - [ ] Explain: what the binary does, how to invoke, the `--seed $COMMIT_SHA` convention, how to interpret each report field, where to find the byte-deterministic guarantee (Story 5.4)
- [ ] CLI smoke test
  - [ ] `tests/cli_smoke.rs` in the crate: shells out with `--circles 10 --seed 00..00` and asserts the output JSON parses + exit code is 0 against known-good program

## Dev Notes

### Architecture compliance (non-negotiables)

- **Path lock:** `crates/susu-adversary/` (workspace member, NOT under `programs/`). Architecture §"Project Structure & Boundaries" line 543: `crates/susu-adversary/` → `src/{main.rs, simulator.rs, scenarios/}`.
- **Output path lock:** `audits/adversary/adversary-report.json` — Story 5.4 demands byte-determinism on this exact path. Don't emit elsewhere.
- **Determinism is the entire point.** This story sets up the *plumbing*; Story 5.4 verifies byte-for-byte reproducibility. If the seed plumbing leaks any non-deterministic source here, 5.4 fails.
- **Surfpool over LiteSVM** for full-fidelity replay (architecture §"Testing Strategy"). LiteSVM is acceptable as a fallback if Surfpool integration slips, but document the choice in the crate's README.

### Source tree to create

```
crates/susu-adversary/
├── Cargo.toml
├── README.md                    # --seed convention, report interpretation
├── build.rs                     # Embed GIT_COMMIT_SHA at build time
├── src/
│   ├── main.rs                  # CLI entrypoint, clap parsing, exit codes
│   ├── simulator.rs             # Lifecycle harness over Surfpool/LiteSVM
│   ├── report.rs                # serde structs for the JSON report
│   └── scenarios/
│       └── mod.rs               # Empty scenario registry; 5.3 adds modules
└── tests/
    └── cli_smoke.rs             # End-to-end CLI invocation test
```

Output (this story emits a sentinel report to prove plumbing works; Story 5.4 emits the canonical 10K artifact):
```
audits/adversary/
├── README.md                    # Lands in 5.4
└── adversary-report.json        # Lands in 5.4 (canonical, byte-deterministic)
```

### Project Structure Notes

- The `--cluster` flag in v1 only supports `localnet` (Surfpool fork). Devnet/mainnet support is a stretch; if you wire it, the report metadata records the cluster name but determinism only holds on `localnet`.
- The crate is a binary, but its scenario modules (added in 5.3) are pub-exported as a library API so unit tests can target them directly without spinning a full simulator.
- Do not output any logs to stdout that aren't structured JSON. Use stderr for human-readable progress.

### Forbidden patterns

- `std::time::SystemTime::now()`, `chrono::Utc::now()`, `OsRng`, `thread_rng()` — all banned in any code path that affects the report. Use the seeded `ChaCha20Rng` exclusively.
- Thread-id, process-id, hostname, working-directory in any output field — banned.
- Floating-point arithmetic in scenario logic — use integer arithmetic on lamport-base units. (Floats are non-deterministic across architectures.)
- HashMap iteration order in the report — use `BTreeMap` or sort vectors before serialization.

### Testing standards

- `cargo test --package susu-adversary` runs the smoke test (small `--circles 10` run with a fixed seed).
- The smoke test should NOT require the canonical 10K artifact to exist — it generates a throwaway report to a tempdir.
- The full 10K-case run is exercised in Story 5.4's CI workflow, not here.

### ATDD Artifacts

- Checklist: `output_susu/test-artifacts/atdd-checklist-5-2-adversary-cli-skeleton.md`
- BDD scenarios: `tests/atdd/story-5-2-adversary-cli-skeleton.atdd.md`
- Static red test: `tests/atdd/story-5-2-adversary-cli-skeleton.static.red.test.mjs`

### References

- [epics.md §Epic 5 / Story 5.2](output_susu/planning-artifacts/epics.md) — full BDD ACs
- [architecture.md §Project Structure & Boundaries](output_susu/planning-artifacts/architecture.md) — `crates/susu-adversary/` layout (line 543)
- [architecture.md §Adversary simulator boundary](output_susu/planning-artifacts/architecture.md) — line 1052
- [architecture.md §CI Pipeline](output_susu/planning-artifacts/architecture.md) — `adversary.yml` workflow (line 429)
- [prd.md §FR22](output_susu/planning-artifacts/prd.md) — adversary binary requirement
- [prd.md §NFR-Re1](output_susu/planning-artifacts/prd.md) — deterministic reproducibility

## Dev Agent Record

### Agent Model Used

_TBD_

### Debug Log References

### Completion Notes List

### File List
