# Story 9.2 — Mainnet deploy with upgrade authority burned at deploy — ATDD

**GH issue:** #91

**Goal:** Provide a documented, scripted, irreversible mainnet deploy ceremony that deploys the program AND burns the upgrade authority to the System Program incinerator (`1nc1nerator11111111111111111111111111111111`), gated on the Story 9.1 audit sign-off and the IDL freeze (FR28/29/30). Story 9.2 ships the script + CI gate + devnet rehearsal evidence ONLY — it does NOT execute mainnet writes. The actual deploy + authority burn is performed by a human operator after the audit firm lands its sign-off PR and the user explicitly authorizes the ceremony.

## Given / When / Then

**Given** the Story 9.1 audit sign-off gate exists at `scripts/check-audit-signoff.sh` with `audits/SKIP_AUDIT_GATE` still committed (pre-audit state)
**When** Story 9.2 lands
**Then** `scripts/deploy-mainnet.sh` exists, is executable, declares a bash shebang, and uses `set -euo pipefail`.

**And** `scripts/deploy-mainnet.sh`:

1. Verifies it is running from the repo root (Anchor.toml + programs/susu present).
2. Verifies `audits/SKIP_AUDIT_GATE` is **absent**; if present, exits 1 with an explicit "audit not yet signed off" message and does NOT delete the sentinel.
3. Runs `bash scripts/check-audit-signoff.sh` with `SUSU_AUDIT_GATE=enforce` and aborts on failure.
4. Prints `solana --version`, `solana config get`, `anchor --version` to the operator.
5. Verifies the deploy keypair has at least 5 SOL on the target cluster (default `mainnet-beta`).
6. Runs `bash scripts/check-idl-hash.sh` to confirm the IDL matches the frozen hash in `IDL_FREEZE.md`.
7. Runs `anchor build --verifiable --ignore-keys` (skippable in CI dry-run via `SUSU_DEPLOY_SKIP_BUILD=1`).
8. **Prints** the `solana program deploy --url mainnet-beta`, `solana program set-upgrade-authority $PROGRAM_ID --new-upgrade-authority 1nc1nerator11111111111111111111111111111111 --final --url mainnet-beta`, and `solana program show $PROGRAM_ID --url mainnet-beta` commands and **halts** with a "type EXECUTE to proceed" prompt in interactive mode, or exits 0 in non-interactive (`SUSU_DEPLOY_NONINTERACTIVE=1`) / non-TTY mode.
9. Even after the operator types EXECUTE, the script **does not** auto-run any `solana program deploy` against mainnet — the operator runs the printed commands manually so they capture every line of output for `/log/`.

**And** `scripts/deploy-devnet-dryrun.sh` exists, is executable, refuses to run against mainnet (`SUSU_DEPLOY_CLUSTER=mainnet*` aborts), targets devnet by default, and produces a JSON evidence file under `audits/devnet-dryrun-<UTC-DATE>.json` capturing cluster, toolchain versions, deploy-keypair pubkey, balance, frozen IDL hash, and a "DRY-RUN — no deploy executed" marker for `program_id` and `upgrade_authority_post_burn`.

**And** the dry-run evidence file `audits/devnet-dryrun-2026-05-09.json` is committed as proof the rehearsal ran end-to-end during Story 9.2 implementation.

**And** `.github/workflows/release.yml` declares an `audit-signoff` job that runs `bash scripts/check-audit-signoff.sh` with `SUSU_AUDIT_GATE=enforce` and is a `needs:` precondition for `verify-build` (and therefore for every downstream publish/release job).

## Out of scope (explicit non-goals for this PR)

- Executing `solana program deploy --url mainnet-beta` (REFUSED by this PR; performed by a human operator after explicit user authorization in a separate ceremony).
- Executing `solana program set-upgrade-authority --final` (same — human operator only).
- Deleting `audits/SKIP_AUDIT_GATE` (the audit firm's landing PR or human operator deletes the sentinel; this script REFUSES while it is present).
- Updating `MAINNET_PROGRAM_ID.md` or `NEXT_PUBLIC_PROGRAM_ID` with a real program ID (a real program ID does not yet exist; the operator updates these as a follow-up commit after the ceremony).

## PR posture

This PR is a DRAFT. It is NOT marked ready-for-review and is NOT merged until: (a) the audit lands and `audits/SKIP_AUDIT_GATE` is removed in a separate PR, AND (b) the user explicitly authorizes the mainnet deploy ceremony, AND (c) a human operator runs `bash scripts/deploy-mainnet.sh` interactively and the resulting program ID + burned-authority verification land in a follow-up PR.
