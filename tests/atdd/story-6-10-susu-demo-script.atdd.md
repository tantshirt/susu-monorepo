# Story 6.10 ATDD: `pnpm susu:demo`

## Scenario 1: Demo Command Orchestrates The Cycle

Given a clean clone with the workspace dependencies installed
When a developer runs `pnpm susu:demo`
Then the root package script invokes `bash scripts/susu-demo.sh`
And the shell orchestrator runs strict preflight checks before invoking `node scripts/susu-demo.mjs`
And the runner executes a 5-member ROSCA flow: create, join, post collateral, contribute through 5 rounds, and claim each payout.

## Scenario 2: Structured Output And Transaction Evidence

Given the demo runs against a devnet or Surfpool RPC endpoint
When each phase completes
Then the output uses structured colored phase lines
And it prints transaction signatures with cluster-aware Solscan links
And the final line is `Demo complete. Wall-clock: Xs.`

## Scenario 3: 60-Second Budget Enforcement

Given NFR-P2 requires the public demo to finish within 60 seconds
When the shell orchestrator exits
Then it parses the measured wall clock
And it fails if the value is greater than `SUSU_DEMO_MAX_SECONDS`, defaulting to 60.

## Scenario 4: Failure Classification

Given the RPC, faucet, or local dependency state can fail independently
When the shell or runner catches an error
Then it classifies the error into `rpc-reachability`, `devnet-airdrop-limit`, `dependency-mismatch`, or `performance-budget`
And it prints a one-line recovery hint with a link to `docs/troubleshooting.md`.

## Scenario 5: Main-Branch CI Smoke

Given GitHub Actions runs after changes land on `main`
When the CI workflow starts
Then a `susu-demo-smoke` job starts a Surfpool devnet fork
And it runs `pnpm susu:demo` against `http://127.0.0.1:8899`
And the job enforces the same <=60 second wall-clock budget.
