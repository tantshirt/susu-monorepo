# Story 5.4 ATDD: Byte-deterministic adversary report

## Scenario 1: Same seed produces identical report bytes

Given the Story 5.2 `susu-adversary` binary exists
And the Story 5.3 `30_percent_cartel` scenario is registered
When the binary runs twice with the same `--circles` and `--seed $COMMIT_SHA`
Then both generated `adversary-report.json` files are byte-identical
And both files end with exactly one trailing newline.

## Scenario 2: Git commit SHA seeds are valid public inputs

Given public usage documents `--seed $COMMIT_SHA`
When the seed is a 40-character Git commit SHA
Then the CLI accepts it deterministically
And derives the RNG seed without reading host, process, time, or environment state.

## Scenario 3: Canonical 10,000-circle report succeeds

Given a clean checkout
When `cargo run --bin susu-adversary --release -- --circles 10000 --seed $COMMIT_SHA` runs
Then the process exits 0
And `summary.max_defector_profit_lamports` equals 0
And `summary.scenarios_covered` includes `"30_percent_cartel"`.

## Scenario 4: Report ordering is stable

Given multiple scenarios are registered
When the report is serialized
Then `summary.scenarios_covered` is sorted by stable scenario name
And `per_scenario_results` is sorted by stable scenario name
And JSON uses pretty formatting with a trailing newline.

## Scenario 5: Determinism guard rejects unstable report sources

Given report-affecting code changes
When forbidden symbols are introduced
Then static checks fail on wall-clock time, unseeded randomness, unordered report iteration, host/process/thread values, environment-derived report metadata, and floating-point arithmetic.

## Scenario 6: Reproduction docs are audit-ready

Given `audits/adversary/adversary-report.json` exists
When an auditor opens `audits/adversary/README.md`
Then the document names the canonical report path
And provides the exact reproduction command
And explains that `$COMMIT_SHA` is the public seed.

