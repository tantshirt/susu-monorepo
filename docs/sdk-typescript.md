# TypeScript SDK

The TypeScript SDK is kit-first: use `@solana/kit` values for addresses, signers, and RPC integration. SDK source must not import `@solana/web3.js` directly.

## Default-Safe Usage

`createSusuClient` requires an explicit `cluster`. There is no default cluster.

```ts
import { contribute, createSusuClient, signer, solanaDevnetRpc } from '@susu/sdk';
import { address, generateKeyPairSigner } from '@solana/kit';

const authority = await generateKeyPairSigner();
const client = createSusuClient({ cluster: 'devnet' })
  .use(signer(authority))
  .use(solanaDevnetRpc({ endpoint: 'https://api.devnet.solana.com' }));

await contribute(client, {
  group: address('11111111111111111111111111111111'),
  amount: 50_000_000n,
  rotationIndex: 0,
});
```

State-changing helpers simulate by default. Omitting `simulate` is the same as passing `simulate: true`; the SDK calls `simulateTransaction` before it requests a signature.

## Advanced Simulation Escape Hatch

Use `simulate: false` only when another trusted layer already simulated the exact transaction.

```ts
await contribute(client, {
  group: address('11111111111111111111111111111111'),
  amount: 50_000_000n,
  rotationIndex: 0,
  simulate: false,
});
```

The escape hatch is per call. There is no global switch to disable simulation.

## Mainnet-Beta Usage

Production mainnet sends must opt in with `cluster: 'mainnet-beta'`.

```ts
import { createSusuClient, signer } from '@susu/sdk';
import { createSolanaRpc, generateKeyPairSigner } from '@solana/kit';

const authority = await generateKeyPairSigner();
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');

const client = createSusuClient({
  cluster: 'mainnet-beta',
  rpc: rpc as never,
}).use(signer(authority));
```

The SDK also performs a defense-in-depth mainnet-resolution heuristic. It rejects known mainnet endpoint strings and, when an explicit `getGenesisHash` RPC hook is supplied, rejects the Solana mainnet-beta genesis hash unless the configured cluster is `mainnet-beta`. This heuristic is not a network identity guarantee; it is an additional guard against obvious configuration mistakes.

## Failure Modes

| Error | When it happens | Recovery |
| --- | --- | --- |
| `SusuSimulationError` | `simulateTransaction` fails or simulation is required but unavailable. The error carries `logs`, `programLogs`, and the underlying `error`. | Inspect the logs, fix account/input state, or simulate upstream and pass `simulate: false` only when the exact transaction was already checked. |
| `SusuClusterError` | `cluster` is missing/empty/unsupported, or the RPC resolves to mainnet while `cluster !== 'mainnet-beta'`. | Pass one of `localnet`, `devnet`, `testnet`, or `mainnet-beta`; use `mainnet-beta` only for intentional production sends. |
