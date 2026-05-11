# `programs/`

On-chain Anchor programs for Susu Protocol.

| Program | Path | Purpose |
| --- | --- | --- |
| `susu` | [`./susu/`](./susu/) | Group lifecycle, dynamic-collateral curve, contributions, slashing, permissionless rotation, payout claim. The single canonical program — all UI and SDK calls bottom out here. |

## Layout

- [`susu/src/`](./susu/src/) — Anchor program source (`lib.rs`, `instructions/`, `state/`, `curve.rs`, `rotation.rs`, `error.rs`).
- [`susu/idl/`](./susu/idl/) — Frozen IDL (`susu.json`). Hash is pinned in [`/IDL_FREEZE.md`](../IDL_FREEZE.md).
- [`susu/tests/`](./susu/tests/) — Property tests including the no-strategic-default invariant (`tests/invariants/no_strategic_default.rs` at workspace root).

## Build

```bash
anchor build              # build the program + regenerate IDL
cargo check --workspace   # fast type-check across all crates
```

The frozen IDL is the source of truth for both the TypeScript SDK ([`/sdk/ts/`](../sdk/)) and the Rust SDK ([`/sdk/rust/`](../sdk/)). Regenerate clients with `pnpm sdk:codegen`.

## Mainnet

This program is **not yet** deployed to mainnet. Mainnet ceremony is gated on audit completion — see [`/docs/epic9-mainnet-gate.md`](../docs/epic9-mainnet-gate.md).
