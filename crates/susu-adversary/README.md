# susu-adversary

`susu-adversary` is the deterministic adversarial simulation binary for Susu Protocol.

Story 5.2 ships the CLI skeleton, seeded RNG plumbing, report schema, and smoke harness. Story 5.3 wires the named 30% Cartel scenario. Story 5.4 owns the byte-deterministic canonical report.

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

Use `--seed $COMMIT_SHA`. Git SHA-1 style 40-character commit IDs are accepted and deterministically expanded to the 32-byte ChaCha20 seed. A 64-character hexadecimal seed remains supported for direct 32-byte seed input. All randomized lifecycle helpers receive the same mutable RNG handle and must not reseed.

## Report Fields

- `run_metadata`: records `seed`, `commit_sha`, `circles`, deterministic `started_at` and `finished_at` markers, and the selected `cluster`.
- `summary`: records `total_runs`, `max_defector_profit_lamports`, and `scenarios_covered`.
- `per_scenario_results`: records one row per scenario with run count, group-size bounds, contribution bounds, max defector profit, and counterexample text.

The CLI exits `0` when `summary.max_defector_profit_lamports == 0`. It exits `1` and writes the worst scenario to stderr if any scenario reports positive defector profit.

## Determinism Boundary

Story 5.4 makes the canonical 10,000-circle report at `audits/adversary/adversary-report.json` byte-deterministic for the same explicit CLI inputs. The report uses deterministic metadata markers, sorted scenario arrays, pretty JSON, and a trailing newline.

TODO: Epic 8 / Story 8.x must add a `30% Cartel` link in the root README badge cluster pointing to `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs`.

The crate intentionally links `solana-sdk` and `susu-client` in the skeleton so later simulator stories can wire deployed-program lifecycle calls without changing the binary's public crate boundary.

Do not use wall-clock time, unseeded RNG, hostnames, process IDs, thread IDs, floating-point scenario math, or unordered report iteration in any code path that affects report bytes.
