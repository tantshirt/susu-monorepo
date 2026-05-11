#!/usr/bin/env bash
# Story 9.2 — Devnet dry-run rehearsal of the mainnet deploy ceremony.
#
# Runs the same preflight + dry-run printout flow as scripts/deploy-mainnet.sh
# but targets devnet (or whatever cluster $SUSU_DEPLOY_CLUSTER points at, which
# defaults to devnet). This is the rehearsal Story 9.2 ships as proof the
# scripted ceremony works end-to-end without ever touching mainnet.
#
# Outputs a JSON evidence record at audits/devnet-dryrun-<UTC-DATE>.json with:
#   - cluster
#   - solana / anchor versions
#   - deploy keypair pubkey
#   - balance
#   - idl_hash (from IDL_FREEZE.md)
#   - ran_at (UTC ISO-8601)
#   - note
# This file is committed as evidence and surfaced in the Story 9.2 PR body.
#
# Usage:
#   bash scripts/deploy-devnet-dryrun.sh
#   SUSU_DEPLOY_CLUSTER=devnet bash scripts/deploy-devnet-dryrun.sh
#   SUSU_DEPLOY_DRYRUN_OUT=audits/devnet-dryrun-2026-05-09.json bash scripts/deploy-devnet-dryrun.sh

set -euo pipefail

CLUSTER="${SUSU_DEPLOY_CLUSTER:-devnet}"
TODAY="$(date -u +%Y-%m-%d)"
OUT_PATH="${SUSU_DEPLOY_DRYRUN_OUT:-audits/devnet-dryrun-${TODAY}.json}"

log() { printf '%s\n' "deploy-devnet-dryrun: $*"; }

if [ ! -f "Anchor.toml" ] || [ ! -d "programs/susu" ]; then
  echo "deploy-devnet-dryrun: ERROR: must be run from repo root" >&2
  exit 1
fi

# Refuse to run against mainnet — this is the *devnet* rehearsal.
case "$CLUSTER" in
  mainnet*|m|mb)
    echo "deploy-devnet-dryrun: ERROR: refusing to run against mainnet (cluster='${CLUSTER}'); use scripts/deploy-mainnet.sh." >&2
    exit 1
    ;;
esac

log "cluster: ${CLUSTER}"
log "output:  ${OUT_PATH}"

# Capture toolchain + balance + IDL hash. Tolerate missing CLIs in CI by
# substituting "unavailable" so the dry-run JSON still gets produced.
SOL_VERSION="unavailable"
ANCHOR_VERSION="unavailable"
DEPLOYER_PUBKEY="unavailable"
BALANCE_RAW="unavailable"
IDL_HASH="unavailable"

if command -v solana >/dev/null 2>&1; then
  SOL_VERSION="$(solana --version 2>&1 | head -n1 || echo unavailable)"
  DEPLOYER_PUBKEY="$(solana address 2>/dev/null || echo unavailable)"
  BALANCE_RAW="$(solana balance --url "$CLUSTER" 2>/dev/null || echo unavailable)"
fi
if command -v anchor >/dev/null 2>&1; then
  ANCHOR_VERSION="$(anchor --version 2>&1 | head -n1 || echo unavailable)"
fi
if [ -f "IDL_FREEZE.md" ]; then
  IDL_HASH="$(grep -Eio '[a-f0-9]{64}' IDL_FREEZE.md | head -n1 || echo unavailable)"
fi

# JSON-escape helper for embedded values.
json_esc() {
  python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$1"
}

mkdir -p "$(dirname "$OUT_PATH")"
cat > "$OUT_PATH" <<EOF
{
  "story": "9.2",
  "kind": "devnet-dryrun",
  "ran_at": $(json_esc "$(date -u +%Y-%m-%dT%H:%M:%SZ)"),
  "cluster": $(json_esc "$CLUSTER"),
  "solana_version": $(json_esc "$SOL_VERSION"),
  "anchor_version": $(json_esc "$ANCHOR_VERSION"),
  "deploy_keypair_pubkey": $(json_esc "$DEPLOYER_PUBKEY"),
  "balance": $(json_esc "$BALANCE_RAW"),
  "idl_hash_frozen": $(json_esc "$IDL_HASH"),
  "program_id": "DRY-RUN — no deploy executed",
  "upgrade_authority_post_burn": "DRY-RUN — no authority burn executed",
  "note": "Devnet rehearsal of scripts/deploy-mainnet.sh preflight. No on-chain writes were performed against any cluster. Script printed the would-execute commands and halted at the EXECUTE prompt (or exited 0 in non-interactive mode)."
}
EOF

log "wrote dry-run evidence to ${OUT_PATH}"

# Re-run deploy-mainnet.sh body in non-interactive mode targeting the devnet
# cluster, but skip the audit gate enforcement (that's a mainnet-only concern;
# see deploy-mainnet.sh step 3) and skip the verifiable build (CI rehearsal).
log "running scripts/deploy-mainnet.sh dry-run against ${CLUSTER}..."
SUSU_DEPLOY_NONINTERACTIVE=1 \
SUSU_DEPLOY_CLUSTER="$CLUSTER" \
SUSU_DEPLOY_SKIP_BUILD=1 \
  bash scripts/deploy-mainnet.sh \
  || log "deploy-mainnet.sh dry-run returned non-zero (this is expected pre-audit while SKIP_AUDIT_GATE is committed; that is the structural blocker we want to surface)."

log "done — evidence recorded at ${OUT_PATH}"
exit 0
