# Contributing

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
