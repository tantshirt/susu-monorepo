# Susu Protocol

Open-source Solana primitive for rotating savings circles (ROSCAs).

Single Anchor program. Stablecoin-only (USDC + USDT). No fees. No yield. No company keys.

The protocol's headline mechanism is a **dynamic-collateral curve** that scales required collateral with rotation position so that no rational defector profits at any slot — codified by a 10K-case property test, a 10K-circle adversarial simulation, and a post-audit immutability gate (upgrade authority burned).

> **Status:** Work in progress. This repository is being built toward a public audit; do not deploy to mainnet from this codebase until a release is tagged with a published audit report and the upgrade authority has been burned.

## License

MIT — see [LICENSE](LICENSE).
