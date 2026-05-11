# `sdk/`

Client SDKs for the Susu Protocol Anchor program. Both SDKs wrap the same Codama-generated instruction layer derived from the frozen IDL at [`/programs/susu/idl/susu.json`](../programs/susu/idl/susu.json).

| SDK | Path | Status |
| --- | --- | --- |
| TypeScript | [`./ts/`](./ts/) — `@susu/sdk` | Primary SDK. Used by the reference web app ([`/apps/reference/`](../apps/reference/)) and partner examples ([`/examples/`](../examples/)). |
| Rust | [`./rust/`](./rust/) — `susu-sdk` | Rust client built on Codama-generated instruction builders. |

## TypeScript

```ts
import { SusuClient } from "@susu/sdk";

const client = new SusuClient({ rpc, programId });
const ix = await client.contribute({ groupPda, amount });
```

See [`./ts/README.md`](./ts/README.md) for full API surface and [`./ts/src/helpers/`](./ts/src/helpers/) for ergonomic helpers (`createGroup`, `contribute`, `claimPayout`, etc.).

## Rust

```rust
use susu_sdk::{SusuClient, instructions};

let ix = instructions::contribute(/* … */);
```

See [`./rust/README.md`](./rust/README.md).

## Regenerating clients

The Codama codegen pipeline lives at [`/codama.config.mjs`](../codama.config.mjs):

```bash
pnpm sdk:codegen
```

Both SDKs must stay in surface-parity — verified by [`/scripts/check-sdk-parity.sh`](../scripts/check-sdk-parity.sh) in CI.
