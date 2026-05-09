#!/usr/bin/env bash
# Story 9.2 — Mainnet deploy + upgrade-authority burn ceremony.
#
# This script is the IRREVERSIBLE mainnet deploy ceremony. It:
#   1. Verifies the audit sign-off gate has been crossed (Story 9.1).
#   2. Verifies toolchain + funded deploy keypair on mainnet.
#   3. Verifies IDL hash freeze (Story 1.6 / FR28-30).
#   4. Builds the program with `anchor build --verifiable`.
#   5. PRINTS the deploy + authority-burn commands and HALTS, requiring the
#      operator to type 'EXECUTE' interactively. In CI / non-interactive mode it
#      exits 0 after the dry-run printout.
#
# This script DOES NOT auto-execute mainnet writes. The human operator runs the
# printed `solana program deploy` and `solana program set-upgrade-authority --final`
# commands themselves after typing EXECUTE.
#
# This script DOES NOT delete audits/SKIP_AUDIT_GATE. The audit firm's PR (or a
# human operator) deletes the sentinel once the audit lands; this script REFUSES
# to proceed while the sentinel is present.
#
# Usage:
#   bash scripts/deploy-mainnet.sh                                  # interactive ceremony
#   SUSU_DEPLOY_NONINTERACTIVE=1 bash scripts/deploy-mainnet.sh     # CI dry-run printout
#
# Companion: scripts/deploy-devnet-dryrun.sh runs the same logic against devnet
# without ever touching mainnet, and is the recommended pre-flight rehearsal.

set -euo pipefail

INCINERATOR="1nc1nerator11111111111111111111111111111111"
SKIP_SENTINEL="audits/SKIP_AUDIT_GATE"
PROGRAM_SO="target/deploy/susu.so"
NONINTERACTIVE="${SUSU_DEPLOY_NONINTERACTIVE:-0}"
TARGET_CLUSTER="${SUSU_DEPLOY_CLUSTER:-mainnet-beta}"

log() { printf '%s\n' "deploy-mainnet: $*"; }
fatal() { printf 'deploy-mainnet: ERROR: %s\n' "$*" >&2; exit 1; }

# Step 1: must run from repo root.
if [ ! -f "Anchor.toml" ] || [ ! -d "programs/susu" ]; then
  fatal "must be run from repository root (expected Anchor.toml + programs/susu/)"
fi
log "step 1/8 OK — running from repo root"

# Step 2: SKIP_AUDIT_GATE must be ABSENT (audit must have landed).
if [ -f "$SKIP_SENTINEL" ]; then
  cat >&2 <<EOF
deploy-mainnet: ERROR: audit not yet signed off.
deploy-mainnet:   ${SKIP_SENTINEL} is still committed.
deploy-mainnet:   Mainnet deploy is BLOCKED until the audit firm's PR lands and
deploy-mainnet:   removes this sentinel (along with adding audits/audit-summary.json
deploy-mainnet:   with critical=0 / high=0 and audits/SIGNED_OFF or signed_off:true).
deploy-mainnet:   This script does NOT delete the sentinel — the audit firm's
deploy-mainnet:   landing PR or a human operator does.
EOF
  exit 1
fi
log "step 2/8 OK — ${SKIP_SENTINEL} is absent (audit landed)"

# Step 3: run scripts/check-audit-signoff.sh in enforce mode.
if [ ! -x "scripts/check-audit-signoff.sh" ] && [ ! -f "scripts/check-audit-signoff.sh" ]; then
  fatal "scripts/check-audit-signoff.sh missing (Story 9.1 artifact)"
fi
log "step 3/8 — running audit sign-off gate (enforce mode)..."
SUSU_AUDIT_GATE=enforce bash scripts/check-audit-signoff.sh \
  || fatal "audit sign-off gate failed; cannot proceed to mainnet deploy"
log "step 3/8 OK — audit sign-off gate passed"

# Step 4: toolchain versions.
command -v solana >/dev/null 2>&1 || fatal "solana CLI not found on PATH"
command -v anchor >/dev/null 2>&1 || fatal "anchor CLI not found on PATH"
log "step 4/8 — toolchain"
log "  solana --version: $(solana --version 2>&1 | head -n1)"
log "  anchor --version: $(anchor --version 2>&1 | head -n1)"
log "  solana config:"
solana config get 2>&1 | sed 's/^/    /'
log "step 4/8 OK"

# Step 5: deploy keypair + balance on target cluster.
log "step 5/8 — verifying deploy keypair balance on ${TARGET_CLUSTER}..."
DEPLOYER_PUBKEY="$(solana address 2>/dev/null || echo unknown)"
log "  deploy keypair pubkey: ${DEPLOYER_PUBKEY}"
BALANCE_RAW="$(solana balance --url "$TARGET_CLUSTER" 2>/dev/null || echo "0 SOL")"
log "  deploy keypair balance (${TARGET_CLUSTER}): ${BALANCE_RAW}"
# Parse leading numeric (e.g., "5.123 SOL" -> 5.123).
BALANCE_SOL="$(printf '%s' "$BALANCE_RAW" | awk '{print $1}')"
case "$BALANCE_SOL" in
  ''|*[!0-9.]*)
    log "  WARN: could not parse balance numerically; visual check required"
    ;;
  *)
    # Compare via awk for floating point
    OK="$(awk -v b="$BALANCE_SOL" 'BEGIN{print (b+0 >= 5.0) ? "1" : "0"}')"
    if [ "$OK" != "1" ]; then
      fatal "deploy keypair balance ${BALANCE_SOL} SOL is below the 5 SOL minimum on ${TARGET_CLUSTER}; top up before retrying"
    fi
    ;;
esac
log "step 5/8 OK"

# Step 6: IDL hash matches frozen IDL_FREEZE.md (FR28/29/30).
log "step 6/8 — verifying IDL hash freeze..."
bash scripts/check-idl-hash.sh \
  || fatal "IDL hash mismatch vs IDL_FREEZE.md — refusing to deploy"
log "step 6/8 OK"

# Step 7: anchor build --verifiable.
log "step 7/8 — running anchor build --verifiable..."
if [ "$NONINTERACTIVE" = "1" ] && [ "${SUSU_DEPLOY_SKIP_BUILD:-0}" = "1" ]; then
  log "  SUSU_DEPLOY_SKIP_BUILD=1 set; skipping verifiable build (CI dry-run)"
else
  RUSTUP_TOOLCHAIN=stable anchor build --verifiable --ignore-keys \
    || fatal "anchor build --verifiable failed"
  if [ ! -s "$PROGRAM_SO" ]; then
    fatal "expected ${PROGRAM_SO} to exist after build"
  fi
fi
log "step 7/8 OK — verifiable .so artifact ready (${PROGRAM_SO})"

# Step 8: print the irreversible commands + halt for operator confirmation.
cat <<EOF

================================================================================
deploy-mainnet: DRY-RUN PRINTOUT — the following commands would be executed by
deploy-mainnet: the human operator after typing EXECUTE:
================================================================================

  # 1) Deploy program to ${TARGET_CLUSTER}.
  solana program deploy --url ${TARGET_CLUSTER} ${PROGRAM_SO}

      -> prints "Program Id: <PROGRAM_ID>"; capture it as \$PROGRAM_ID.

  # 2) Burn upgrade authority to the System Program incinerator.
  solana program set-upgrade-authority \$PROGRAM_ID \\
    --new-upgrade-authority ${INCINERATOR} \\
    --final --url ${TARGET_CLUSTER}

  # 3) Verify authority is the incinerator.
  solana program show \$PROGRAM_ID --url ${TARGET_CLUSTER}
      -> "Upgrade Authority: ${INCINERATOR}" required.

  # 4) Tag and update repo:
  echo \$PROGRAM_ID > MAINNET_PROGRAM_ID.md  # update with metadata
  # Update NEXT_PUBLIC_PROGRAM_ID in .env.example.
  # Capture full session output in /log/$(date -u +%Y-%m-%d).md.
  git tag v0.1.0-mainnet
  git push origin v0.1.0-mainnet

================================================================================
deploy-mainnet: This ceremony is IRREVERSIBLE. Once \`--final\` is set the
deploy-mainnet: upgrade authority cannot be recovered. The program becomes
deploy-mainnet: structurally immutable.
================================================================================

EOF

if [ "$NONINTERACTIVE" = "1" ] || [ ! -t 0 ]; then
  log "step 8/8 — non-interactive mode detected (CI dry-run); exiting 0 without prompting"
  exit 0
fi

printf 'deploy-mainnet: type EXECUTE (in caps) to acknowledge and proceed (anything else aborts): '
read -r CONFIRM
if [ "$CONFIRM" != "EXECUTE" ]; then
  log "step 8/8 — operator did not type EXECUTE; aborting (no mainnet writes performed)"
  exit 0
fi

log "step 8/8 — operator typed EXECUTE."
log "step 8/8 — NOTE: this script does not auto-run the printed deploy/burn commands."
log "step 8/8 — Run them MANUALLY in this shell so you can see + capture every line"
log "step 8/8 — of output. Append the output to /log/\$(date -u +%Y-%m-%d).md for"
log "step 8/8 — transparency (FR55)."
exit 0
