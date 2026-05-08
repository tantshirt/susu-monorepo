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
| `SusuSimulationError` | `simulateTransaction` returns a failed simulation. The error carries `logs`, `programLogs`, a decoded program `cause` when available, and the raw simulation `error`. | Inspect the logs, fix account/input state, or simulate upstream and pass `simulate: false` only when the exact transaction was already checked. |
| `SusuRpcError` | RPC connectivity, timeout, missing required transaction hooks, or 5xx-style provider failures. | Retry with backoff, switch endpoints, or supply an RPC object with the required SDK hooks. |
| `SusuClusterError` | `cluster` is missing/empty/unsupported, or the RPC resolves to mainnet while `cluster !== 'mainnet-beta'`. | Pass one of `localnet`, `devnet`, `testnet`, or `mainnet-beta`; use `mainnet-beta` only for intentional production sends. |

## Error Taxonomy

All SDK-thrown errors extend `SusuErrorBase`. The canonical discriminator is `kind`; use `switch (err.kind)` instead of parsing messages.

| Class | kind | Fields |
| --- | --- | --- |
| `SusuError` | `program` | `code`, `name`, `instructionName`, `simulationLogs` |
| `SusuSimulationError` | `simulation` | `logs`, `programLogs`, `cause`, `error` |
| `SusuRpcError` | `rpc` | `endpoint`, `status`, `cause` |
| `SusuClusterError` | `cluster` | `reason`, `expected`, `actual`, `cluster`, `endpoint`, `genesisHash` |

Program errors are decoded from Anchor simulation logs when the program emits a `SusuError` number. Non-Anchor simulation failures still throw `SusuSimulationError`, but `cause` is undefined and the raw simulation result remains in `error`.

```ts
import { SusuErrorBase, isSusuError } from '@susu/sdk';

try {
  await contribute(client, {
    group,
    amount: 50_000_000n,
    rotationIndex: 0,
  });
} catch (err) {
  if (!isSusuError(err)) {
    throw err;
  }

  switch (err.kind) {
    case 'program':
      console.log(err.code, err.name, err.instructionName);
      break;
    case 'simulation':
      console.log(err.logs, err.programLogs, err.cause);
      break;
    case 'rpc':
      console.log(err.endpoint, err.status, err.cause);
      break;
    case 'cluster':
      console.log(err.expected, err.actual, err.reason);
      break;
  }
}

function renderSdkError(err: SusuErrorBase): string {
  switch (err.kind) {
    case 'program':
      return 'Program rejected the transaction.';
    case 'simulation':
      return 'Simulation failed before send.';
    case 'rpc':
      return 'RPC request failed.';
    case 'cluster':
      return 'Cluster configuration is invalid.';
  }
}
```

| kind | Recovery hint |
| --- | --- |
| program | Match on `code` or `name`, show product-specific UX, and let the user correct account or instruction inputs. |
| simulation | Inspect `logs` and `programLogs`; if `cause?.kind === 'program'`, handle the decoded program error first. |
| rpc | Retry with backoff for timeouts or 5xx responses, or switch endpoint when `endpoint` identifies an unhealthy provider. |
| cluster | Correct `cluster` configuration before retrying; use `mainnet-beta` only for intentional production sends. |
