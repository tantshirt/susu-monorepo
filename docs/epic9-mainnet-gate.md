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

## Deploy and burn (high level)

1. Deploy to **mainnet-beta** through the **approved** deploy procedure (multisig / authority workflow as defined by the team).
2. **Burn upgrade authority** to the System Program incinerator (`1nc1nerator11111111111111111111111111111111`) when ready for immutability.
3. Re-run immutability / IDL checks on `mainnet-beta`.
4. Update public surfaces: README badges, environment defaults for production, and any “upgrade burned” API routes.

## After mainnet

- Tag release (e.g. `v0.1.0-mainnet`) with matching IDL artifact.
- Monitor RPC, incident response, and communication for integrators.
- Keep devnet documentation (e.g. [demo-setup.md](./demo-setup.md)) accurate for developers **not** on mainnet yet.

## References

- [`output_susu/implementation-artifacts/sprint-status.yaml`](../output_susu/implementation-artifacts/sprint-status.yaml) — Epic 9 story status
- [`docs/troubleshooting.md`](./troubleshooting.md) — `immutability` bucket
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — mainnet-only checks
