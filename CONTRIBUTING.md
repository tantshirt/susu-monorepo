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

## Audit sign-off gate (NFR-S1)

Mainnet deploy (Story 9.2) is blocked by `scripts/check-audit-signoff.sh`. The gate is enforced through `.github/workflows/audit-signoff.yml` on PRs touching mainnet-deploy artifacts (`programs/susu/**`, `Anchor.toml`, `.github/workflows/release.yml`, `scripts/deploy-mainnet.sh`, `MAINNET_PROGRAM_ID.md`, `IDL_FREEZE.md`, `audits/**`).

Run it locally:

```bash
pnpm audit:check
# or
bash scripts/check-audit-signoff.sh
```

Skip mode (deliberate, pre-audit):

- The committed sentinel `audits/SKIP_AUDIT_GATE` makes the gate exit 0 with a "skipped (pre-audit)" message.
- `SUSU_AUDIT_GATE=skip` produces the same effect for local runs.

Enforcement mode (post-audit, sentinel removed) requires all of:

- `audits/audit-summary.json` with `critical == 0` and `high == 0` (per epics §9.1 AC).
- A committed, non-empty audit report PDF at `audits/{firm-slug}-{YYYY-MM}.pdf`.
- A structural sign-off artifact: either `audits/SIGNED_OFF` (non-empty) or `signed_off: true` plus `signed_off_at: <date>` in `audits/audit-summary.json`.
- If `audits/findings-tracker.md` exists, every blocking (Critical/High) finding must carry a `resolved-at:` line.

Story 9.2's mainnet-deploy preflight is responsible for deleting `audits/SKIP_AUDIT_GATE` and confirming the gate then passes; failure at that point is the explicit "audit not done" blocker the operator must surface.

## Mainnet deploy ceremony (Story 9.2 — irreversible)

Mainnet deploy + upgrade-authority burn is a **one-way, irreversible ceremony** performed by a human operator. The procedure is scripted at `scripts/deploy-mainnet.sh`:

```bash
bash scripts/deploy-mainnet.sh
```

Preflight steps (all enforced before the operator is prompted):

1. Repo-root sanity check (Anchor.toml + programs/susu present).
2. `audits/SKIP_AUDIT_GATE` must be **absent** (i.e., the audit firm has already landed its sign-off PR). The script does NOT delete the sentinel itself — that removal is part of the audit-firm landing PR or a separate human commit.
3. `bash scripts/check-audit-signoff.sh` runs in `SUSU_AUDIT_GATE=enforce` mode and must pass (zero Critical / zero High, signed-off, PDF report committed).
4. Solana CLI, Anchor CLI, and `solana config get` are printed.
5. Deploy keypair has at least 5 SOL on the target cluster (default `mainnet-beta`).
6. `bash scripts/check-idl-hash.sh` confirms the IDL matches `IDL_FREEZE.md` (FR28/29/30).
7. `anchor build --verifiable --ignore-keys` produces `target/deploy/susu.so`.
8. The script **prints** the deploy + authority-burn commands and **halts**, requiring the operator to type `EXECUTE`. Even after EXECUTE, the script does not auto-run the deploy — the operator runs the printed commands manually so every line of output is captured for `/log/YYYY-MM-DD.md`.

The printed commands the operator runs:

```bash
# Deploy program
solana program deploy --url mainnet-beta target/deploy/susu.so
# -> capture Program Id as $PROGRAM_ID

# Burn upgrade authority to the System Program incinerator (irreversible)
solana program set-upgrade-authority $PROGRAM_ID \
  --new-upgrade-authority 1nc1nerator11111111111111111111111111111111 \
  --final --url mainnet-beta

# Verify
solana program show $PROGRAM_ID --url mainnet-beta
# -> Upgrade Authority MUST equal 1nc1nerator11111111111111111111111111111111
```

After the ceremony the operator must:

- Update `MAINNET_PROGRAM_ID.md` with the resulting program ID + tx signatures.
- Update `NEXT_PUBLIC_PROGRAM_ID` in `.env.example`.
- Append the full ceremony output to `/log/YYYY-MM-DD.md` (FR55).
- Tag the release: `git tag v0.1.0-mainnet && git push origin v0.1.0-mainnet`.

**Devnet rehearsal:** `bash scripts/deploy-devnet-dryrun.sh` runs the same preflight against devnet (refuses to run against mainnet) and captures evidence to `audits/devnet-dryrun-YYYY-MM-DD.json`. Use it to validate operator setup before the real ceremony.

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
pnpm exec tsx scripts/check-i18n-parity.ts
bash scripts/check-fincen-posture.sh
```

Notes:
- `scripts/check-i18n-parity.ts` and `scripts/check-fincen-posture.sh` vacuously pass until their target surfaces exist.
- `scripts/check-sdk-parity.sh` **must** regenerate both Codama SDK trees and enforce structural parity; treat failures as regressions rather than drifting generated output.
- If you use `act`, run `act pull_request -j lint-and-build` to iterate on `ci.yml` locally.

## Reproducing every claim in <10 minutes

Auditors, judges, and maintainers should use the one-command verification path from a clean clone:

```bash
pnpm verify
```

`pnpm verify` installs the locked JavaScript dependencies, builds and tests the Anchor program, runs the Rust workspace tests, regenerates the 10,000-circle adversary report with the current commit SHA as seed, runs the 60-second demo, checks the frozen IDL hash, checks TypeScript/Rust SDK parity, runs the skip-aware immutability check, and verifies locale key parity. The script prints a per-step summary and fails if the full run exceeds 600 seconds.

For mainnet-only checks, set `CLUSTER=mainnet-beta` and optionally `SUSU_PROGRAM_ID` and `RPC_URL`. On devnet or local forks, `scripts/check-immutability.sh` exits 0 with a skip message. Failure buckets and recovery hints live in [`docs/troubleshooting.md`](./docs/troubleshooting.md).

## Releasing a new version

Releases are tag-driven and must use the OIDC trusted-publishing workflow in `.github/workflows/release.yml`; do not add long-lived `NPM_TOKEN` or `CARGO_TOKEN` secrets.

1. Confirm `pnpm verify` passes locally.
2. Bump matching versions in `sdk/ts/package.json` and `sdk/rust/Cargo.toml`.
3. Commit the version bump and tag it, for example `git tag v0.1.0`.
4. Push the tag with `git push origin v0.1.0`.
5. The release workflow runs the verifiable build, IDL hash gate, SDK parity gate, full verify chain, npm publish for `@susu/sdk`, crates.io publish for `susu-client`, provenance attestation, and GitHub release creation.

### Trusted publisher registration

An owner must register the trusted publishers before the first release:

- npm: configure `@susu/sdk` to trust `tantshirt/susu-monorepo`, workflow `.github/workflows/release.yml`, environment `release`.
- crates.io: configure `susu-client` to trust `tantshirt/susu-monorepo`, workflow `.github/workflows/release.yml`, environment `release`.
- Repository settings: confirm no `NPM_TOKEN` or `CARGO_TOKEN` long-lived release secrets exist.

### Half-published recovery

The workflow publishes npm first, then crates, then creates the GitHub release. If npm succeeds and crates fails, do not create a GitHub release manually. Either fix crates publishing and rerun the tagged workflow for the same version if the registry allows it, or publish a patch version and deprecate/yank the incomplete artifact according to registry policy. Document the incident in `/log/YYYY-MM-DD.md`.

## Translation Contributions

For locale work, follow [CONTRIBUTING-TRANSLATIONS.md](./CONTRIBUTING-TRANSLATIONS.md).
