# Story 6.1 ATDD: TS SDK Fluent Client

## Scenario 1: Fluent Client Surface

Given an integrator imports `@susu/sdk`
When they compose `createSusuClient().use(signer(...)).use(solanaDevnetRpc({...}))`
Then the package exposes `createSusuClient`, `signer`, `solanaDevnetRpc`, and the fluent `.use(plugin)` API
And the client state carries `cluster`, `rpc`, `signer`, and `programId`.

## Scenario 2: State Helpers Delegate to Generated Builders

Given the Codama-generated instruction builders exist under `sdk/ts/src/generated/instructions/`
When an integrator calls `createGroup`, `acceptInvite`, `postCollateral`, `contribute`, `claimPayout`, `topUpCollateral`, `withdrawCollateral`, or `cancelGroup`
Then each helper calls the matching generated builder
And no helper hand-rolls instruction data bytes, discriminators, or account metas.

## Scenario 3: Compute Budget Defaults Are Prepended

Given Solana mainnet congestion requires bounded compute and priority fees
When any state-changing helper builds a transaction request
Then it prepends compute-unit limit `200_000`
And it prepends a compute-unit price from `getPriorityFeeEstimate` unless `{ priorityFee }` is supplied
And callers may override `{ computeUnits, priorityFee }`.

## Scenario 4: Read Helpers Decode Generated Accounts

Given Group, MemberPosition, and rotation history data are available through RPC
When an integrator calls `getGroup`, `getMemberPosition`, or `queryHistory`
Then the helpers use generated account decoders and PDA helpers
And return typed account/history objects rather than raw RPC responses.

## Scenario 5: Public API Is Documented and Package-Ready

Given `sdk/ts/package.json` declares the package as `@susu/sdk`
When `sdk/ts/src/index.ts` is inspected
Then every public helper is exported
And public exports have runnable JSDoc examples with kit-first imports
And the package export map points consumers at `dist/`.
