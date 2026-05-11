#!/usr/bin/env bash
# Story 9.2 — Mainnet deploy with upgrade authority burned at deploy.
#
# Atomic deploy + burn ceremony. The program is deployed with the upgrade
# authority set directly to the System Program incinerator
# (1nc1nerator11111111111111111111111111111111) so there is no human-error
# window between deploy and burn — the moment the deploy succeeds, the program
# is immutable.
#
# This script is the canonical mainnet ceremony. It refuses to run against
# mainnet-beta until:
#   1. audits/SKIP_AUDIT_GATE has been deleted (operator's explicit blocker).
#   2. scripts/check-audit-signoff.sh exits 0 (Story 9.1 gate).
#
# Flags:
#   --cluster {mainnet-beta|devnet}   default: mainnet-beta
#   --dry-run                         print the deploy command, do not run it
#   --program-keypair PATH            program keypair (required for first deploy)
#   --payer PATH                      payer keypair (required)
#   --rpc-url URL                     override RPC URL (defaults to cluster default)
#   --skip-audit-gate                 BYPASS the Story 9.1 gate (devnet only)
#
# Examples:
#   # Devnet dry-run (smoke test the script wiring):
#   bash scripts/deploy-mainnet.sh --cluster devnet --dry-run
#
#   # Real devnet deploy (no audit gate; produces an immutable devnet program):
#   bash scripts/deploy-mainnet.sh --cluster devnet --skip-audit-gate \
#       --program-keypair ./keys/program.json --payer ./keys/payer.json
#
#   # Real mainnet deploy (irreversible — only after audit gate passes):
#   rm audits/SKIP_AUDIT_GATE
#   bash scripts/deploy-mainnet.sh --cluster mainnet-beta \
#       --program-keypair ./keys/program.json --payer ./keys/payer.json
#
# After a successful deploy, this script writes MAINNET_PROGRAM_ID.md (or
# DEVNET_PROGRAM_ID.md for the devnet variant) at the repo root with the
# program ID, deploy timestamp, deploy SHA, and the cluster.

set -euo pipefail

INCINERATOR="1nc1nerator11111111111111111111111111111111"

CLUSTER="mainnet-beta"
DRY_RUN="0"
SKIP_AUDIT_GATE_FLAG="0"
PROGRAM_KEYPAIR=""
PAYER=""
RPC_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cluster)
      CLUSTER="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="1"
      shift
      ;;
    --skip-audit-gate)
      SKIP_AUDIT_GATE_FLAG="1"
      shift
      ;;
    --program-keypair)
      PROGRAM_KEYPAIR="$2"
      shift 2
      ;;
    --payer)
      PAYER="$2"
      shift 2
      ;;
    --rpc-url)
      RPC_URL="$2"
      shift 2
      ;;
    -h|--help)
      grep -E '^#( |$)' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "deploy-mainnet: unknown flag: $1" >&2
      exit 2
      ;;
  esac
done

case "$CLUSTER" in
  mainnet-beta|devnet) ;;
  *)
    echo "deploy-mainnet: --cluster must be mainnet-beta or devnet (got: ${CLUSTER})" >&2
    exit 2
    ;;
esac

# -----------------------------------------------------------------------------
# Preflight: irreversibility & audit gate
# -----------------------------------------------------------------------------

if [[ "$CLUSTER" == "mainnet-beta" && "$SKIP_AUDIT_GATE_FLAG" == "1" ]]; then
  echo "deploy-mainnet: --skip-audit-gate is forbidden against mainnet-beta" >&2
  exit 1
fi

if [[ "$CLUSTER" == "mainnet-beta" ]]; then
  if [[ -f "audits/SKIP_AUDIT_GATE" ]]; then
    cat >&2 <<'EOF'
deploy-mainnet: REFUSED — audits/SKIP_AUDIT_GATE is still committed.

This sentinel intentionally blocks mainnet deploy until the audit firm has
delivered a report with zero Critical and zero High findings. Removing it is
the explicit operator action that arms this script.

To proceed:
  1. Confirm the audit report is committed under audits/{firm-slug}-{YYYY-MM}.pdf
  2. Confirm audits/audit-summary.json shows critical == 0 && high == 0
  3. git rm audits/SKIP_AUDIT_GATE && git commit -m "chore: arm mainnet deploy"
  4. Re-run this script.
EOF
    exit 1
  fi

  echo "deploy-mainnet: running Story 9.1 audit sign-off gate"
  bash scripts/check-audit-signoff.sh
fi

# -----------------------------------------------------------------------------
# Required tooling and keypairs
# -----------------------------------------------------------------------------

if ! command -v solana >/dev/null 2>&1; then
  echo "deploy-mainnet: solana CLI is required" >&2
  exit 1
fi

if ! command -v anchor >/dev/null 2>&1; then
  echo "deploy-mainnet: anchor CLI is required (build the program first)" >&2
  exit 1
fi

if [[ "$DRY_RUN" == "0" ]]; then
  if [[ -z "$PAYER" ]]; then
    echo "deploy-mainnet: --payer is required for non-dry-run" >&2
    exit 2
  fi
  if [[ ! -f "$PAYER" ]]; then
    echo "deploy-mainnet: payer keypair not found: $PAYER" >&2
    exit 1
  fi
fi

# -----------------------------------------------------------------------------
# Build the program (must be reproducible)
# -----------------------------------------------------------------------------
#
# Always rebuild — never deploy a stale `.so`. The mainnet ceremony is
# irreversible; deploying yesterday's bytecode while staring at today's git
# HEAD is the worst possible failure mode. The dry-run path skips this so
# the smoke test stays fast.

PROGRAM_SO="target/deploy/susu.so"

if [[ "$DRY_RUN" == "0" ]]; then
  echo "deploy-mainnet: building program (anchor build)"
  anchor build
  if [[ ! -f "$PROGRAM_SO" ]]; then
    echo "deploy-mainnet: anchor build did not produce ${PROGRAM_SO}" >&2
    exit 1
  fi
else
  echo "deploy-mainnet: [dry-run] skipping anchor build"
fi

# -----------------------------------------------------------------------------
# Deploy
# -----------------------------------------------------------------------------
#
# Build the args array in a single pass so the `--url` override (when
# `--rpc-url` is supplied) replaces the cluster default rather than appearing
# twice. Bash's `${array[@]/pat/repl}` operates on individual elements, so
# the previous "remove `--url $CLUSTER`" approach didn't actually remove
# anything when the two were separate array elements.

DEPLOY_ARGS=(program deploy "$PROGRAM_SO" --upgrade-authority "$INCINERATOR")

if [[ -n "$RPC_URL" ]]; then
  DEPLOY_ARGS+=(--url "$RPC_URL")
else
  case "$CLUSTER" in
    mainnet-beta) DEPLOY_ARGS+=(--url mainnet-beta) ;;
    devnet)       DEPLOY_ARGS+=(--url devnet) ;;
  esac
fi

if [[ -n "$PROGRAM_KEYPAIR" ]]; then
  DEPLOY_ARGS+=(--program-id "$PROGRAM_KEYPAIR")
fi

if [[ -n "$PAYER" ]]; then
  DEPLOY_ARGS+=(--keypair "$PAYER")
fi

echo "deploy-mainnet: cluster=${CLUSTER} dry_run=${DRY_RUN}"
echo "deploy-mainnet: command: solana ${DEPLOY_ARGS[*]}"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "deploy-mainnet: dry-run complete — no transaction submitted"
  exit 0
fi

# Real deploy. Tee through a logfile so the operator sees progress in real
# time AND we can parse the program id from the captured output afterward
# (a long-running ceremony staring at a frozen terminal is the wrong UX).
DEPLOY_LOG="$(mktemp -t susu-deploy.XXXXXX.log)"
trap 'echo "deploy-mainnet: log preserved at ${DEPLOY_LOG}" >&2' EXIT
solana "${DEPLOY_ARGS[@]}" 2>&1 | tee "$DEPLOY_LOG"

PROGRAM_ID="$(awk '/^Program Id:/ {print $3; exit}' "$DEPLOY_LOG")"
if [[ -z "$PROGRAM_ID" ]]; then
  echo "deploy-mainnet: failed to parse Program Id from solana output" >&2
  exit 1
fi

# -----------------------------------------------------------------------------
# Post-deploy: write the program-id artifact
# -----------------------------------------------------------------------------

case "$CLUSTER" in
  mainnet-beta)
    OUT_PATH="MAINNET_PROGRAM_ID.md"
    ;;
  devnet)
    OUT_PATH="DEVNET_PROGRAM_ID.md"
    ;;
esac

DEPLOY_SHA="$(git rev-parse HEAD)"
DEPLOY_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Portable SHA-256: GNU coreutils ships sha256sum; macOS / BSD ship shasum.
if command -v sha256sum >/dev/null 2>&1; then
  IDL_HASH="$(sha256sum programs/susu/idl/susu.json | awk '{print $1}')"
elif command -v shasum >/dev/null 2>&1; then
  IDL_HASH="$(shasum -a 256 programs/susu/idl/susu.json | awk '{print $1}')"
else
  echo "deploy-mainnet: neither sha256sum nor shasum found; cannot hash IDL" >&2
  exit 1
fi

cat > "$OUT_PATH" <<EOF
# ${CLUSTER} program id

| Field | Value |
| --- | --- |
| Program ID | \`${PROGRAM_ID}\` |
| Cluster | \`${CLUSTER}\` |
| Upgrade authority | \`${INCINERATOR}\` (System Program incinerator — burned) |
| Deployed at | ${DEPLOY_AT} |
| Deploy SHA | \`${DEPLOY_SHA}\` |
| IDL SHA-256 | \`${IDL_HASH}\` |

This program is **immutable**. Any bug requires a new program at a new ID
(\`susu-v2\`); there is no upgrade path.

Verify on-chain:

\`\`\`bash
solana program show ${PROGRAM_ID} --url ${CLUSTER}
\`\`\`

The expected upgrade authority is \`${INCINERATOR}\`. If anything else is
returned, the immutability claim has been violated and the
[\`immutability-check.yml\`](.github/workflows/immutability-check.yml) workflow
will fail.
EOF

echo "deploy-mainnet: wrote ${OUT_PATH}"
echo "deploy-mainnet: program ${PROGRAM_ID} on ${CLUSTER} — upgrade authority burned"
