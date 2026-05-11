# `scripts/`

Operational, CI, and verification scripts. All scripts are invoked either by [`/package.json`](../package.json), a workflow under [`/.github/workflows/`](../.github/workflows/), or another script.

## Categories

### Verification gates (CI-anchored)

| Script | Used by | Purpose |
| --- | --- | --- |
| [`verify.sh`](./verify.sh) | `pnpm verify`, [`verify.yml`](../.github/workflows/verify.yml) | One-command reproducibility — full build/test/lint/parity gauntlet. |
| [`check-i18n-parity.ts`](./check-i18n-parity.ts) | `pnpm i18n:check`, [`i18n-parity.yml`](../.github/workflows/i18n-parity.yml) | Asserts every locale message file has the same key set as `en.json`. |
| [`check-sdk-parity.sh`](./check-sdk-parity.sh) | [`ci.yml`](../.github/workflows/ci.yml) | Diffs TS SDK and Rust SDK public surface. |
| [`check-idl-hash.sh`](./check-idl-hash.sh) | [`ci.yml`](../.github/workflows/ci.yml) | Asserts the on-disk IDL matches the hash pinned in [`/IDL_FREEZE.md`](../IDL_FREEZE.md). |
| [`check-patterns.sh`](./check-patterns.sh) | [`ci.yml`](../.github/workflows/ci.yml) | Pattern guards (no `process.env` outside `lib/env.ts`, no `pl-`/`pr-`/`ml-`/`mr-` outside RTL-safe zones, etc.). |
| [`check-adversary-determinism.sh`](./check-adversary-determinism.sh) | [`ci.yml`](../.github/workflows/ci.yml) | Asserts the adversary report regenerates byte-identical from a fixed seed. |
| [`check-immutability.sh`](./check-immutability.sh) | [`immutability-check.yml`](../.github/workflows/immutability-check.yml) (post-mainnet) | Asserts the deployed program upgrade authority equals the System Program incinerator. |
| [`check-audit-signoff.sh`](./check-audit-signoff.sh) | `pnpm audit:check`, [`audit-signoff.yml`](../.github/workflows/audit-signoff.yml) | Story 9.1 gate — blocks mainnet deploy until audit shows zero Critical/High. |
| [`check-audit-report-citations.sh`](./check-audit-report-citations.sh) | [`audits/README.md`](../audits/README.md) | Asserts the final audit report cites the curve invariant + adversary artifact. |
| [`check-fincen-posture.sh`](./check-fincen-posture.sh) | CI | Asserts the FinCEN/CVC framing doc remains in sync. |
| [`check-bad-skill-sync.sh`](./check-bad-skill-sync.sh) | CI | BAD skill-manifest sync check. |

### Demo & dev tooling

| Script | Used by | Purpose |
| --- | --- | --- |
| [`susu-demo.sh`](./susu-demo.sh) | `pnpm susu:demo` | One-command devnet demo — boots the reference app, airdrops, runs the lifecycle. |
| [`susu-demo.mjs`](./susu-demo.mjs), [`susu-demo-classify.mjs`](./susu-demo-classify.mjs) | `susu-demo.sh` | Internal demo orchestration helpers. |
| [`render-curve-hero.mjs`](./render-curve-hero.mjs) | Story 8.1 / 8.4 | Generates the README hero curve SVG. |
| [`render-legal-placeholder.sh`](./render-legal-placeholder.sh) | Pre-audit operations | Renders the legal-opinion placeholder PDF. |
| [`legal-handoff.sh`](./legal-handoff.sh) | Pre-audit operations | Packages legal-opinion handoff bundle. |
| [`audit-handoff.sh`](./audit-handoff.sh) | Audit firm engagement | Packages the audit handoff tarball under `audits/handoff-*.tar.gz`. |
| [`compare-sdk-surfaces.mjs`](./compare-sdk-surfaces.mjs) | `check-sdk-parity.sh` | Diffs the two SDK surfaces. |
| [`extract-ts-surface.mjs`](./extract-ts-surface.mjs) | `check-sdk-parity.sh` | Extracts TS SDK public surface. |
| [`sync-latest-log.sh`](./sync-latest-log.sh) | Story 8.5 | Regenerates `log/latest.md` symlink. |
| [`swap-partner-reference.sh`](./swap-partner-reference.sh) | Story 8.7 | Swaps the placeholder partner link cluster for a real one. |

### Mainnet ceremony (Epic 9 — gated on audit)

| Script | Status |
| --- | --- |
| [`deploy-mainnet.sh`](./deploy-mainnet.sh) | Scaffolding (Story 9.2). Refuses real mainnet deploy until `audits/SKIP_AUDIT_GATE` is removed and audit gate passes. |
| [`check-immutability.sh`](./check-immutability.sh) | Live (Story 9.3). |
