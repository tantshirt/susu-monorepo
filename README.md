# Susu Protocol Monorepo

> Placeholder hero for Epic 1. This section is intentionally brief and will be replaced in Epic 8 with the polished first-viewport narrative and demo embed.
>
> ![Static collateral curve hero](./static/curve-collateral.svg)

Susu Protocol is a public-from-commit-zero monorepo for building rotating savings circles on Solana with auditable program constraints, multilingual onboarding, and SDK-first integration paths.

## Badges

[![Audit](https://img.shields.io/badge/audit-pending-lightgrey)](./audits/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Devnet Program](https://img.shields.io/badge/devnet-program%20id-tbd-lightgrey)](./programs/susu/)
[![CI](https://img.shields.io/badge/ci-scaffold-lightgrey)](./.github/workflows/)
[![Adversary Report](https://img.shields.io/badge/adversary-report%20pending-lightgrey)](./audits/adversary/)
[![Upgrade Burned](https://img.shields.io/badge/upgrade-burned%20proof%20pending-lightgrey)](./docs/)

Badge links are scaffold slots in Epic 1 and may stay unresolved until later stories wire workflows and reports.

## Directory Tree

- `programs/`: On-chain Anchor program workspace.
- `sdk/`: Generated and hand-authored client SDK surfaces (TypeScript and Rust).
- `apps/`: Reference application(s) and integration UI.
- `examples/`: End-to-end integration examples (Privy, Squads, Token Extensions).
- `crates/`: Auxiliary Rust crates (including adversary simulation tooling).
- `tests/`: Invariant, coverage, and higher-level test assets.
- `audits/`: External and adversarial audit artifacts.
- `docs/`: Architecture, status, and operational documentation.
- `log/`: Daily engineering log entries.
- `scripts/`: Repository automation and policy checks.

## Quickstart

```bash
pnpm install
pnpm susu:demo
```

## Project Links

- [Documentation](./docs/)
- [Examples](./examples/)
- [Program Source](./programs/susu/)
- [Contribution Guide](./CONTRIBUTING.md)
- [Translation Guide](./CONTRIBUTING-TRANSLATIONS.md)

Public from commit zero. MIT licensed. Audit-pending.
