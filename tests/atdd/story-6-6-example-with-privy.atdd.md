# Story 6.6 ATDD: Example With Privy

## Scenario 1: Privy example package is independently runnable

Given the repository has the Story 6.1-6.3 SDK surface
When `examples/with-privy` is installed and started
Then the package declares its own start, build, and test scripts
And it depends on `@susu/sdk`, `@privy-io/node`, `@solana/kit`, and `@solana/web3-compat`
And it does not import from `apps/reference` or another example package.

## Scenario 2: Privy signer is adapted to the Susu SDK

Given three mock members are provisioned as Privy Solana wallets
When the example runs the happy path
Then it creates a Susu client with a Privy-backed signer
And it calls `createGroup`, `acceptInvite`, `postCollateral`, and `contribute`
And it prints transaction signatures and final group state.

## Scenario 3: The example remains copy-pasteable

Given the source files are intended as integration documentation
When the static acceptance checks inspect `examples/with-privy/src`
Then the source stays at or below 200 lines
And it is kit-first with no `@solana/web3.js` imports
And all runtime configuration is read from environment variables.

## Scenario 4: Tests cover the happy path without live credentials

Given CI should not require live Privy credentials by default
When tests run
Then unit tests mock the Privy signing surface
And the e2e happy path is present but gated behind `PNPM_TEST_E2E=1`.
