# @susu/sdk

TypeScript helpers for integrating the Susu Protocol with kit-first Solana apps.

## Quickstart

```ts
import {
  acceptInvite,
  cancelGroup,
  claimPayout,
  contribute,
  createGroup,
  createSusuClient,
  getGroup,
  getMemberPosition,
  postCollateral,
  queryHistory,
  signer,
  solanaDevnetRpc,
  topUpCollateral,
  withdrawCollateral,
} from '@susu/sdk';
import { address, generateKeyPairSigner } from '@solana/kit';

const authority = await generateKeyPairSigner();
const client = createSusuClient({ cluster: 'devnet' })
  .use(signer(authority))
  .use(solanaDevnetRpc({ endpoint: 'https://api.devnet.solana.com' }));

const group = address('11111111111111111111111111111111');
await contribute(client, { group, amount: 50_000_000n });
const decodedGroup = await getGroup(client, group);
```

## Helpers

State-changing helpers return a transaction signature after sending through the injected RPC:

- `createGroup`
- `acceptInvite`
- `postCollateral`
- `contribute`
- `claimPayout`
- `topUpCollateral`
- `withdrawCollateral`
- `cancelGroup`

Read helpers return decoded account or history data:

- `queryHistory`
- `getGroup`
- `getMemberPosition`

Every state-changing helper delegates instruction construction to the Codama-generated builders in `src/generated/`, simulates by default before sending, and prepends compute-budget instructions by default. Override compute budget settings per call:

```ts
await claimPayout(client, {
  group,
  rotationIndex: 0,
  computeUnits: 250_000,
  priorityFee: 5_000n,
});
```

Pass `{ simulate: false }` only when an upstream relayer or wallet flow already performed simulation.

The SDK does not read environment variables. Pass RPC, signer, cluster, and program configuration through `createSusuClient()` or fluent plugins.
