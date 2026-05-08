# Story 6.3 ATDD: SDK typed error classes

## Scenario 1: Public Error Taxonomy

Given an integrator imports the TypeScript SDK public barrel
When they inspect the SDK error exports
Then the SDK exposes `SusuErrorBase`, `SusuError`, `SusuSimulationError`, `SusuRpcError`, and `SusuClusterError`
And each class extends `Error`
And each error carries a stable `kind` discriminator for TypeScript pattern matching.

## Scenario 2: Anchor Program Error Decode

Given simulation logs include an Anchor `SusuError` program error
When `executeTx` receives the failed simulation response
Then it throws `SusuSimulationError`
And the simulation error cause is a decoded `SusuError`
And the program error exposes the numeric `code`, enum `name`, optional `instructionName`, and raw simulation logs.

## Scenario 3: Non-Anchor Simulation Failure

Given simulation logs do not include a decodable Anchor program error
When `executeTx` receives the failed simulation response
Then it throws `SusuSimulationError`
And the error preserves `logs` and `programLogs`
And `cause` remains undefined.

## Scenario 4: RPC Transport Failure

Given the configured RPC rejects or times out during simulation or send
When a state-changing helper executes through the shared transaction path
Then the SDK wraps the transport failure in `SusuRpcError`
And the error includes RPC context such as `endpoint`, `status`, or `cause` when available.

## Scenario 5: No Bare SDK Throws

Given SDK source under `sdk/ts/src`
When Story 6.3 is complete
Then no SDK source throws `new Error(...)`
And no SDK source rejects with a string literal.

## Scenario 6: Pattern-Matching Documentation

Given an integrator reads the TypeScript SDK documentation
When they reach the error section
Then the docs describe the full taxonomy, fields, and recovery hints
And show a `switch (err.kind)` example that narrows `program`, `simulation`, `rpc`, and `cluster` errors.
