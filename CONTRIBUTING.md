# Contributing to Susu Protocol

Thanks for contributing. This repository is public-from-commit-zero and uses a strict review posture around protocol safety and documentation quality.

## Dev Setup

### Required Toolchain

- Node.js 20 LTS (see `.nvmrc`):
  ```bash
  nvm use
  ```
- pnpm 9.x via Corepack:
  ```bash
  corepack enable
  corepack prepare pnpm@9 --activate
  ```
- Rust toolchain pinned in `rust-toolchain.toml`:
  ```bash
  rustup show
  ```
- Anchor 1.0.x:
  ```bash
  avm install 1.0.2 && avm use 1.0.2
  ```
- Solana CLI:
  ```bash
  sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
  ```

## First-Issue-Tag Flow

- Start with issues labeled `good-first-issue` or `help-wanted`.
- Leave a short comment to claim the issue before opening a PR.
- If you are blocked for more than 48 hours, unclaim so others can pick it up.

## PR Template Usage

- Every PR should use [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md).
- Fill `What`, `Why`, `How`, and `Test plan` with concrete, reproducible details.
- Link the issue in the PR body (`Fixes #123`) when applicable.

## CODEOWNERS Pattern

- Ownership rules live in [`CODEOWNERS`](./CODEOWNERS).
- Changes touching protected protocol paths require approval from listed owners.
- If your PR modifies a protected path, request owner review early to avoid merge delays.

## IDL Re-freeze Policy

Any change to `IDL_FREEZE.md` requires all of the following in the same PR:

1. A justification entry in `/log/YYYY-MM-DD.md`.
2. Updated hash values in `IDL_FREEZE.md`.
3. Coordination note for the tagged release that will publish the new interface.

## FinCEN Posture Clauses

Susu Protocol contribution standards preserve three non-negotiable posture constraints:

- Non-custodial architecture
- Non-fee protocol flow
- Non-yield representation

These clauses are enforced in policy scripts (including `scripts/check-fincen-posture.sh` once CI scaffolding lands).

## CI / Local Verification

The CI workflow in `.github/workflows/ci.yml` runs on each pull request and on pushes to `main`.

Toolchain pins used by CI and expected locally:
- Node: `.nvmrc` (20 LTS)
- pnpm: `package.json` (`packageManager`, currently `pnpm@9.12.3`)
- Rust: `rust-toolchain.toml`
- Anchor CLI: `v1.0.0`

Run the same checks locally from repository root:

```bash
pnpm install --frozen-lockfile
anchor build
cargo test --workspace
pnpm test
bash scripts/check-idl-hash.sh
bash scripts/check-patterns.sh
bash scripts/check-sdk-parity.sh
pnpm tsx scripts/check-i18n-parity.ts
bash scripts/check-fincen-posture.sh
```

Notes:
- `scripts/check-i18n-parity.ts` and `scripts/check-fincen-posture.sh` vacuously pass until their target surfaces exist.
- `scripts/check-sdk-parity.sh` vacuously passes only when Rust generated SDK output is missing/empty.
- If you use `act`, run `act pull_request -j lint-and-build` to iterate on `ci.yml` locally.

## Translation Contributions

For locale work, follow [CONTRIBUTING-TRANSLATIONS.md](./CONTRIBUTING-TRANSLATIONS.md).
