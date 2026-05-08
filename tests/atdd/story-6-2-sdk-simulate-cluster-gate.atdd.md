# Story 6.2 ATDD: SDK simulate-by-default + explicit-cluster gate

## Scenario 1: Explicit Cluster Is Required

Given an integrator creates a Susu SDK client
When `createSusuClient` is called without a non-empty `cluster`
Then it throws `SusuClusterError` synchronously
And no helper can default to devnet, testnet, localnet, or mainnet.

## Scenario 2: Mainnet Resolution Requires Mainnet Cluster

Given the SDK can identify an RPC endpoint or genesis hash as Solana mainnet-beta
When the client is configured with any cluster other than `mainnet-beta`
Then the SDK throws `SusuClusterError`
And the state-changing helper must throw before building the transaction instruction.

## Scenario 3: State Helpers Simulate Before Send

Given an integrator calls any state-changing helper
When `simulate` is omitted or set to `true`
Then the helper builds through the shared `executeTx` path
And `executeTx` calls `rpc.simulateTransaction` before requesting a signature
And only sends the transaction after simulation succeeds.

## Scenario 4: Simulation Failures Are Typed And Logged

Given `rpc.simulateTransaction` returns a failed simulation
When a helper is invoked with default simulation behavior
Then the SDK throws `SusuSimulationError`
And the error exposes the raw logs, program logs, and underlying simulation error
And the SDK does not call any send method.

## Scenario 5: Advanced Simulation Escape Hatch

Given an advanced integrator has already simulated upstream
When a state-changing helper is called with `{ simulate: false }`
Then the SDK skips `simulateTransaction`
And still sends through the same shared `executeTx` signature-returning path.

## Scenario 6: Kit-First Public Surface And Documentation

Given the SDK source and docs are inspected
When Story 6.2 is complete
Then `sdk/ts/src/` contains no direct `@solana/web3.js` imports
And `docs/sdk-typescript.md` documents default simulation, `{ simulate: false }`, explicit mainnet usage, the mainnet-resolution heuristic, and typed recovery guidance.
