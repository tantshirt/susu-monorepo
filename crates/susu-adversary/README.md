# susu-adversary

`susu-adversary` is the deterministic adversarial simulation binary for Susu Protocol.

Story 5.2 ships the CLI skeleton, seeded RNG plumbing, report schema, and smoke harness. Later Epic 5 stories wire the full Surfpool lifecycle runner, the named 30% Cartel scenario, and the byte-deterministic canonical report.

## Usage

```sh
cargo run --bin susu-adversary -- --circles 10000 --seed $COMMIT_SHA --cluster localnet
```

The canonical output path is:

```text
audits/adversary/adversary-report.json
```

For smoke tests or local experiments, pass `--output <path>` to avoid overwriting the canonical report.

## Seed Convention

Use `--seed $COMMIT_SHA` with a 64-character hexadecimal commit SHA. The binary decodes that value into 32 bytes and constructs `ChaCha20Rng::from_seed(seed_bytes)`. All randomized lifecycle helpers receive the same mutable RNG handle and must not reseed.

## Report Fields

- `run_metadata`: records `seed`, `commit_sha`, `circles`, deterministic `started_at` and `finished_at` markers, and the selected `cluster`.
- `summary`: records `total_runs`, `max_defector_profit_lamports`, and `scenarios_covered`.
- `per_scenario_results`: records one row per scenario with run count, group-size bounds, contribution bounds, max defector profit, and counterexample text.

The CLI exits `0` when `summary.max_defector_profit_lamports == 0`. It exits `1` and writes the worst scenario to stderr if any scenario reports positive defector profit.

## Determinism Boundary

Story 5.2 uses a deterministic localnet skeleton so the CLI contract can be tested without Surfpool being available on every developer machine. Story 5.4 owns the byte-deterministic guarantee for the canonical 10,000-circle report at `audits/adversary/adversary-report.json`.

Do not use wall-clock time, unseeded RNG, hostnames, process IDs, thread IDs, floating-point scenario math, or unordered report iteration in any code path that affects report bytes.
