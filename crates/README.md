# `crates/`

Workspace-internal Rust crates that aren't shipped as the on-chain program or the public SDK.

| Crate | Path | Purpose |
| --- | --- | --- |
| `susu-adversary` | [`./susu-adversary/`](./susu-adversary/) | Adversarial simulation harness — generates `audits/adversary/adversary-report.json` (10,000 randomized circles). Backs the README's "10,000 adversarial circles passed" claim. |
| `extract-rust-surface` | [`./extract-rust-surface/`](./extract-rust-surface/) | Tool that extracts the Rust SDK's public surface so [`/scripts/check-sdk-parity.sh`](../scripts/check-sdk-parity.sh) can diff it against the TypeScript SDK. |

## Build

```bash
cargo check --workspace
cargo run -p susu-adversary -- --help
```

These crates are part of the workspace defined in [`/Cargo.toml`](../Cargo.toml). They are **not** published to crates.io.
