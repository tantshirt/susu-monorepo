<!-- susu:hero:start -->
<!-- susu:hero:h1 -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/Susu%20Protocol-14F195?style=for-the-badge&logoColor=white&label=&color=14F195&labelColor=14F195" />
    <img alt="Susu Protocol" src="https://img.shields.io/badge/Susu%20Protocol-14F195?style=for-the-badge&logoColor=white&label=&color=14F195&labelColor=14F195" />
  </picture>
</p>

<h1 align="center" style="font-family: Geist Display, system-ui, sans-serif; font-size: 56px; line-height: 64px; font-weight: 700; letter-spacing: -0.01em;">
  Susu Protocol
</h1>

<!-- susu:hero:subhead -->
<p align="center">
  <strong>The dynamic-collateral ROSCA primitive on Solana.</strong>
  <br />
  Public from commit zero. Auditable curve invariant. SDK-first integration paths.
</p>

<!-- susu:hero:badges -->
<p align="center">
  <a href="./docs/legal-engagement.md"><img alt="Audit pending" src="https://img.shields.io/badge/audit-pending-lightgrey" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg" /></a>
  <a href="./programs/susu/"><img alt="Devnet program" src="https://img.shields.io/badge/devnet-program%20id%20tbd-lightgrey" /></a>
  <a href="./docs/"><img alt="Mainnet pending" src="https://img.shields.io/badge/mainnet-pending%20Epic%209-lightgrey" /></a>
  <a href="./audits/adversary/adversary-report.json"><img alt="10,000 adversarial circles passed" src="https://susu.protocol/api/badge/adversary" /></a>
  <a href="./docs/threat-model.md"><img alt="Upgrade authority: burned" src="https://susu.protocol/api/badge/upgrade-burned" /></a>
  <a href="https://github.com/tantshirt/susu-monorepo/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/tantshirt/susu-monorepo/actions/workflows/ci.yml/badge.svg?branch=main" /></a>
</p>

<p align="center">

[![Legal Opinion](https://img.shields.io/badge/legal-opinion%20placeholder-yellow)](./docs/legal-opinion.pdf)

</p>

<!-- susu:hero:demo -->
### One command to run the demo

Copy this into your terminal:

```bash
pnpm susu:demo
```

<sub>demo took $WALL_CLOCK_SECONDSs last verified at $COMMIT_SHA</sub>

<!-- susu:hero:watch-cta -->
<p align="center">
  <!-- TODO (Story 8.6 follow-up): replace TODO_youtube_id with the canonical YouTube ID after upload. The self-hosted fallback lives at apps/reference/public/demo.mp4 (Git LFS). Subtitles: apps/reference/public/demo.{en,vi}.vtt. -->
  <a href="https://www.youtube.com/watch?v=TODO_youtube_id">
    <img src="./apps/reference/public/demo-poster.svg" alt="Watch the 60-second Susu Protocol demo" width="600" />
  </a>
</p>
<p align="center"><sub>Self-hosted fallback: <a href="./apps/reference/public/demo.mp4"><code>apps/reference/public/demo.mp4</code></a> · subtitles: <a href="./apps/reference/public/demo.en.vtt">EN</a> · <a href="./apps/reference/public/demo.vi.vtt">VI</a></sub></p>

<!-- susu:hero:fork-cta -->
<p>
  <a href="https://github.com/tantshirt/susu-monorepo/fork"><strong>⑂ Fork on GitHub</strong></a>
  &nbsp;·&nbsp;
  <a href="./CONTRIBUTING.md">contribute</a>
  &nbsp;·&nbsp;
  <a href="./examples/">browse partner examples</a>
</p>

<!-- susu:hero:curve-hook -->
> **The novelty:** Susu uses a dynamic-collateral curve `C_i = contribution × (2n − 1 − i)` so that the recipient with the most to gain posts the most collateral. No rational defector profits at any rotation slot — proven by [10,000 adversarial circles](./audits/adversary/adversary-report.json) and a [property-test invariant](./docs/collateral-curve.md).

<!-- susu:hero:curve-svg -->
<p align="center">
  <img alt="Susu dynamic-collateral curve" src="./docs/assets/curve-hero.svg" width="720" />
</p>

<!-- susu:hero:end -->

<!-- susu:linkcluster:start -->

## Verify every claim

Every assertion in the hero above is one click from its verifier. If a link 404s, the [markdown-link-check workflow](./.github/workflows/markdown-link-check.yml) blocks the merge.

| Claim | Verifier |
| --- | --- |
| The dynamic-collateral curve has no rational defector | [`docs/collateral-curve.md`](./docs/collateral-curve.md) |
| 10,000 adversarial circles passed | [`audits/adversary/adversary-report.json`](./audits/adversary/adversary-report.json) |
| Legal posture documented | [`docs/legal-opinion.pdf`](./docs/legal-opinion.pdf) |
| Daily engineering log (latest entry) | [`log/latest.md`](./log/latest.md) |
<!-- susu:linkcluster:partner -->
| Ecosystem partner integration (placeholder until [Story 8.7](https://github.com/tantshirt/susu-monorepo/issues/89) confirms a real partner) | [`examples/with-privy/`](./examples/with-privy/) |
<!-- /susu:linkcluster:partner -->

<!-- susu:linkcluster:end -->

---

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
