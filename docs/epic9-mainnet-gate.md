# Epic 9 — Mainnet deploy and immutability gate

Epic 9 tracks **mainnet** program deployment, **upgrade authority burn**, and **immutability verification**. It is **separate** from the devnet `pnpm susu:demo` path and from local reference-app development.

## When to use this checklist

Use this after:

- Devnet demos and the reference **member** app are stable on `devnet` (or your chosen pre-mainnet cluster)
- Audit engagement is complete per project policy (**no Critical/High** findings before mainnet, per PRD / NFR-S1)
- Legal and operational stakeholders have approved mainnet deployment

## Pre-mainnet verification

1. **Program ID** — documented `NEXT_PUBLIC_PROGRAM_ID` / deploy script matches the binary you intend to ship.
2. **IDL** — `idl/susu.json` hash matches `IDL_FREEZE.md` (or the repo’s documented freeze process).
3. **`pnpm verify`** — passes on a clean clone within the reproducibility budget.
4. **`scripts/check-immutability.sh`** — understand that immutability checks are enforced when `CLUSTER=mainnet-beta` (see script and [CONTRIBUTING.md](../CONTRIBUTING.md)).

## Deploy and burn (atomic ceremony)

The atomic ceremony is automated by [`scripts/deploy-mainnet.sh`](../scripts/deploy-mainnet.sh) (Story 9.2). See the **Mainnet ceremony** section in [`/CONTRIBUTING.md`](../CONTRIBUTING.md) for the full pre-flight checklist and step-by-step.

Summary:

1. Confirm audit gate passes; remove `audits/SKIP_AUDIT_GATE`.
2. Smoke test on devnet: `bash scripts/deploy-mainnet.sh --cluster devnet --dry-run`.
3. Run the mainnet ceremony: `bash scripts/deploy-mainnet.sh --cluster mainnet-beta --program-keypair … --payer …`. Deploy + burn happen in the same transaction (`--upgrade-authority 1nc1nerator11111111111111111111111111111111`).
4. The script writes [`MAINNET_PROGRAM_ID.md`](../MAINNET_PROGRAM_ID.md) at the repo root with program ID, deploy SHA, IDL hash, and timestamp.

## After mainnet (Story 9.4 — manual)

1. Commit `MAINNET_PROGRAM_ID.md`.
2. The badge route at [`apps/reference/app/api/badge/upgrade-burned/route.ts`](../apps/reference/app/api/badge/upgrade-burned/route.ts) auto-resolves the program id from this file via [`apps/reference/lib/badge/load-mainnet-program-id.ts`](../apps/reference/lib/badge/load-mainnet-program-id.ts), flipping the badge from `pending` to `verified` on the next build.
3. The [`immutability-check.yml`](../.github/workflows/immutability-check.yml) workflow (Story 9.3) starts asserting the burn on every push and nightly cron.
4. Tag the release: `git tag v0.1.0-mainnet && git push --tags`. Release notes should cite program ID, audit report path, adversary artifact, IDL hash, legal opinion path, and deployed-at timestamp.
5. Monitor RPC, incident response, and communicate the new program id to integrators.
6. Add a daily-log entry at `/log/YYYY-MM-DD.md` documenting the moment the badge first flipped — the canonical "Susu became infrastructure" log.
7. Keep devnet documentation (e.g. [demo-setup.md](./demo-setup.md)) accurate for developers **not** on mainnet yet.

## References

- [`output_susu/implementation-artifacts/sprint-status.yaml`](../output_susu/implementation-artifacts/sprint-status.yaml) — Epic 9 story status
- [`docs/troubleshooting.md`](./troubleshooting.md) — `immutability` bucket
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — mainnet-only checks
