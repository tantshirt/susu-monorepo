# Story 5.2 ATDD: `susu-adversary` CLI skeleton

## Scenario 1: CLI parses deterministic run arguments

Given the `crates/susu-adversary` workspace crate exists
When `cargo run --bin susu-adversary -- --circles 10000 --seed <64hex> --cluster localnet` runs
Then the binary accepts `--circles`, `--seed`, and `--cluster`
And `--circles` defaults to `10000`
And `--cluster` defaults to `localnet`
And an invalid seed fails before simulator startup.

## Scenario 2: Seeded RNG is the only randomness source

Given a 64-character hexadecimal seed
When the binary initializes simulation state
Then it decodes exactly 32 seed bytes
And constructs `ChaCha20Rng::from_seed(seed_bytes)`
And every randomized helper receives `&mut ChaCha20Rng`
And source code does not use `thread_rng`, `OsRng`, wall-clock timestamps, process IDs, thread IDs, hostnames, or floating-point scenario math.

## Scenario 3: Simulator skeleton emits stable report schema

Given a smoke run with `--circles 10`
When the simulator completes the skeleton lifecycle harness
Then it emits JSON containing `run_metadata`, `summary`, and `per_scenario_results`
And `run_metadata` includes `seed`, `commit_sha`, `circles`, `started_at`, and `finished_at`
And `summary` includes `total_runs`, `max_defector_profit_lamports`, and `scenarios_covered`
And the report is written with pretty JSON plus a trailing newline.

## Scenario 4: Exit status reflects adversary profit

Given the simulator summary has `max_defector_profit_lamports == 0`
When the CLI exits
Then it exits with status `0`
And when the maximum defector profit is positive
Then it exits with status `1` and names the worst scenario on stderr.

## Scenario 5: Documentation explains reproducibility

Given the CLI crate is present
When a developer opens `crates/susu-adversary/README.md`
Then it documents the `--seed $COMMIT_SHA` convention
And explains the report fields
And records that Story 5.2 uses a local deterministic skeleton while later Epic 5 stories wire the full Surfpool/30% Cartel canonical run.
