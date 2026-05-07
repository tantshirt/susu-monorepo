# Surfpool Integration Spike Status (Story 1.6)

- Story: `1.6-daily-log-day1-spikes`
- Date: `2026-05-07`
- Status: `LiteSVM-fallback`

## Spike Result

Surfpool validation could not be executed in this environment due to missing binaries.

Commands executed in this worktree:

- `surfpool --version` -> failed (`surfpool: command not found`, exit 127)
- `anchor test --skip-local-validator` -> failed (`anchor: command not found`, exit 127)

Because both Surfpool and Anchor are unavailable, the hello-world deploy/invoke spike could not be run.

## Decision

Per architecture fallback guidance, Epic 2 should use `LiteSVM-fallback` for local smart-contract tests until Surfpool compatibility is validated on a machine with:

- Surfpool installed and runnable
- Anchor CLI available
- Matching Solana/Anchor versions for deploy + invoke

## Follow-Up Validation Plan

When tooling is available:

1. Start Surfpool fork instance locally.
2. Run an Anchor hello-world deploy/invoke against Surfpool RPC.
3. If successful, upgrade status to `working` and record exact setup and command transcript.
4. If incompatible, keep `LiteSVM-fallback` and carry that into Epic 2 test strategy.
