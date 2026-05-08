# susu-client

Rust client SDK for Susu Protocol.

```rust
use solana_client::rpc_client::RpcClient;
use susu_client::{Cluster, SusuClient};

let rpc = RpcClient::new("https://api.devnet.solana.com".to_string());
let client = SusuClient::new(Cluster::Devnet, rpc);
```

State-changing helpers return a transaction builder that simulates by default.
Call `.with_simulate(false)` before `.send(&signers)` when the caller wants to
skip the explicit simulation pass.

```rust
let signature = client
    .contribute(accounts, args)
    .with_simulate(false)
    .send(&signers)?;
```

The `generated` module is the Story 1.3 Codama fallback output. Story 6.4 adds
the hand-rolled Rust ergonomics, PDA helpers, account decoders, and typed errors
documented in `docs/codama-rust-status.md`.
