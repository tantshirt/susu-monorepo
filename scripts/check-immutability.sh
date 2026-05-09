#!/usr/bin/env bash
set -euo pipefail

CLUSTER="${CLUSTER:-${SUSU_CLUSTER:-devnet}}"
PROGRAM_ID="${SUSU_PROGRAM_ID:-2f6CBrNHZp8oyXPFRXfzroGx5pZ7WyLA6dUqFFpYsX2N}"
RPC_URL="${RPC_URL:-${SOLANA_RPC_URL:-}}"

if [ "$CLUSTER" != "mainnet-beta" ]; then
  echo "check-immutability: skipped (immutability check is mainnet-only; CLUSTER=${CLUSTER})"
  exit 0
fi

if ! command -v solana >/dev/null 2>&1; then
  echo "check-immutability: solana CLI is required for mainnet-beta" >&2
  exit 1
fi

args=(program show "$PROGRAM_ID" --output json)
if [ -n "$RPC_URL" ]; then
  args+=(--url "$RPC_URL")
else
  args+=(--url mainnet-beta)
fi

program_json="$(solana "${args[@]}")"
upgrade_authority="$(printf '%s' "$program_json" | node -e '
let input = "";
process.stdin.on("data", (chunk) => input += chunk);
process.stdin.on("end", () => {
  const value = JSON.parse(input);
  const authority = value.programData?.upgradeAuthority ?? value.upgradeAuthority ?? null;
  process.stdout.write(authority === null ? "" : String(authority));
});
')"

if [ -n "$upgrade_authority" ]; then
  echo "check-immutability: program is still upgradeable; upgrade authority=${upgrade_authority}" >&2
  exit 1
fi

echo "check-immutability: OK (upgrade authority burned)"
