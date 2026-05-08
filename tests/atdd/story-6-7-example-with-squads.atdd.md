# Story 6.7 ATDD: examples/with-squads

## Scenario 1: Independent Squads Example Package

Given the repository workspace includes `examples/*`
When Story 6.7 is complete
Then `examples/with-squads` is a private package named `@susu-examples/with-squads`
And it exposes `start`, `test`, and `build` scripts
And it depends on `@susu/sdk`, `@sqds/multisig`, `@solana/kit`, and `@solana/web3-compat`.

## Scenario 2: Multisig-as-Creator Flow

Given the example has access to the Susu SDK and Squads SDK
When the start script runs
Then it creates or connects to a 2-of-3 Squads multisig
And it creates a Susu client whose signer address is the Squads multisig PDA
And it submits a Susu `createGroup` instruction through a Squads vault transaction proposal.

## Scenario 3: Creator Verification

Given the Squads vault transaction executes
When the example verifies the resulting Susu group
Then the group's `creator` field equals the Squads multisig PDA
And the example prints the multisig, vault, group, proposal, and signature identifiers.

## Scenario 4: Governance Trade-Offs

Given a developer reads `examples/with-squads/README.md`
When they evaluate the integration pattern
Then the README documents setup, env vars, run commands, and the trade-offs of multisig governance
And the trade-offs cover latency, recovery, censorship, threshold sizing, and mainnet considerations.

## Scenario 5: Test Coverage and Guardrails

Given the example source is intentionally small and copy-pasteable
When the ATDD and package tests run
Then unit tests cover the adapter/proposal happy path
And the gated e2e test covers the multisig-as-creator happy path
And source under `examples/with-squads/src` stays at or below 200 lines
And the example does not import from `apps/reference`, other examples, or `@solana/web3.js`.
