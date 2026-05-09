#!/usr/bin/env bash
set -euo pipefail

start_epoch="$(date +%s)"

max_seconds="${SUSU_DEMO_MAX_SECONDS:-60}"
cluster="${SUSU_DEMO_CLUSTER:-devnet}"
rpc_url="${SUSU_DEMO_RPC_URL:-${HELIUS_RPC_URL:-${NEXT_PUBLIC_HELIUS_RPC_URL:-https://api.devnet.solana.com}}}"
commitment="${SUSU_DEMO_COMMITMENT:-confirmed}"
keypair_dir="${SUSU_DEMO_KEYPAIR_DIR:-.susu-demo/keypairs}"
payer_keypair="${SUSU_DEMO_KEYPAIR_PATH:-.susu-demo/payer.json}"
skip_preflight="${SUSU_DEMO_SKIP_PREFLIGHT:-0}"
skip_airdrop="${SUSU_DEMO_SKIP_AIRDROP:-0}"

if [ -t 1 ] && [ "${NO_COLOR:-0}" = "0" ]; then
  cyan="$(printf '\033[36m')"
  green="$(printf '\033[32m')"
  yellow="$(printf '\033[33m')"
  red="$(printf '\033[31m')"
  reset="$(printf '\033[0m')"
else
  cyan=""
  green=""
  yellow=""
  red=""
  reset=""
fi

phase() {
  printf '%s==> %s%s\n' "$cyan" "$1" "$reset"
}

ok() {
  printf '%s✓%s %s\n' "$green" "$reset" "$1"
}

warn() {
  printf '%s!%s %s\n' "$yellow" "$reset" "$1"
}

fail_bucket() {
  bucket="$1"
  message="$2"
  link="$3"
  printf '%s✗ [%s]%s %s See %s\n' "$red" "$bucket" "$reset" "$message" "$link" >&2
  exit 1
}

require_command() {
  name="$1"
  hint="$2"
  if ! command -v "$name" >/dev/null 2>&1; then
    fail_bucket "dependency-mismatch" "$hint" "docs/troubleshooting.md#dependency-mismatch"
  fi
}

classify_runner_failure() {
  text="$1"
  classification="$(printf '%s' "$text" | node scripts/susu-demo-classify.mjs)" || \
    fail_bucket "dependency-mismatch" "Failed to classify demo error. Run \`pnpm install\` and retry." "docs/troubleshooting.md#dependency-mismatch"
  tab="$(printf '\t')"
  IFS="$tab" read -r bucket message link <<EOF
$classification
EOF
  if [ -z "${bucket:-}" ] || [ -z "${message:-}" ] || [ -z "${link:-}" ]; then
    fail_bucket "dependency-mismatch" "Failed to classify demo error. Run \`pnpm install\` and retry." "docs/troubleshooting.md#dependency-mismatch"
  fi
  fail_bucket "$bucket" "$message" "$link"
}

check_rpc() {
  SUSU_DEMO_RPC_URL="$rpc_url" node --input-type=module <<'NODE'
const endpoint = process.env.SUSU_DEMO_RPC_URL;
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 8000);
try {
  const response = await fetch(endpoint, {
    method: 'POST',
    signal: controller.signal,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'susu-demo-health', method: 'getHealth' }),
  });
  if (!response.ok) {
    throw new Error(`RPC health HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (payload.error) {
    throw new Error(`RPC health error ${JSON.stringify(payload.error)}`);
  }
} finally {
  clearTimeout(timeout);
}
NODE
}

ensure_keypair() {
  path="$1"
  if [ ! -f "$path" ]; then
    mkdir -p "$(dirname "$path")"
    solana-keygen new --no-bip39-passphrase --force --silent -o "$path" >/dev/null
  fi
}

pubkey_for() {
  solana-keygen pubkey "$1"
}

balance_lamports() {
  address="$1"
  solana --url "$rpc_url" balance "$address" --lamports 2>/dev/null | tr -dc '0-9'
}

airdrop_if_needed() {
  address="$1"
  minimum_lamports="$2"
  amount_sol="$3"
  balance="$(balance_lamports "$address")"
  balance="${balance:-0}"
  if [ "$balance" -lt "$minimum_lamports" ]; then
    if [ "$skip_airdrop" = "1" ]; then
      warn "Skipping airdrop for $address with balance ${balance} lamports"
      return
    fi
    if ! solana --url "$rpc_url" airdrop "$amount_sol" "$address" >/tmp/susu-demo-airdrop.log 2>&1; then
      classify_runner_failure "$(cat /tmp/susu-demo-airdrop.log)"
    fi
    balance="$(balance_lamports "$address")"
    balance="${balance:-0}"
  fi
  ok "funded keypair $address balance=${balance} lamports"
}

phase "Phase 0: pre-flight checks"
require_command node "Toolchain mismatch. Node.js is required."
require_command pnpm "Toolchain mismatch. pnpm is required."

node_version="$(node --version)"
pnpm_version="$(pnpm --version)"
ok "node $node_version"
ok "pnpm $pnpm_version"

if [ "$skip_preflight" = "1" ]; then
  warn "SUSU_DEMO_SKIP_PREFLIGHT=1; skipping anchor, solana, RPC, and airdrop checks"
else
  require_command anchor "Toolchain mismatch. Anchor CLI is required."
  require_command solana "Toolchain mismatch. Solana CLI is required."
  require_command solana-keygen "Toolchain mismatch. Solana keygen is required."

  ok "$(anchor --version)"
  ok "$(solana --version)"

  if ! check_rpc >/tmp/susu-demo-rpc.log 2>&1; then
    classify_runner_failure "$(cat /tmp/susu-demo-rpc.log)"
  fi
  ok "devnet RPC reachable: $rpc_url"

  ensure_keypair "$payer_keypair"
  payer_address="$(pubkey_for "$payer_keypair")"
  airdrop_if_needed "$payer_address" 500000000 1
fi

phase "Phase 1: mock member keypairs"
mkdir -p "$keypair_dir"
member_addresses=()
for index in 1 2 3 4 5; do
  keypair_path="$keypair_dir/member-${index}.json"
  if [ "$skip_preflight" = "1" ]; then
    member_address="DemoMember${index}111111111111111111111111111111111"
  else
    ensure_keypair "$keypair_path"
    member_address="$(pubkey_for "$keypair_path")"
    airdrop_if_needed "$member_address" 100000000 0.1
  fi
  member_addresses+=("$member_address")
  ok "member ${index}: ${member_address}"
done

phase "Phase 2: SDK mock ROSCA cycle"
if ! pnpm --filter @susu/sdk build >/tmp/susu-demo-sdk-build.log 2>&1; then
  classify_runner_failure "$(cat /tmp/susu-demo-sdk-build.log)"
fi
ok "workspace @susu/sdk built"

member_csv="$(IFS=,; printf '%s' "${member_addresses[*]}")"
runner_output="$(
  SUSU_DEMO_RPC_URL="$rpc_url" \
  SUSU_DEMO_CLUSTER="$cluster" \
  SUSU_DEMO_COMMITMENT="$commitment" \
  SUSU_DEMO_MEMBER_ADDRESSES="$member_csv" \
  node scripts/susu-demo.mjs 2>&1
)" || classify_runner_failure "$runner_output"
printf '%s\n' "$runner_output"

end_epoch="$(date +%s)"
elapsed=$((end_epoch - start_epoch))
if [ "$elapsed" -gt "$max_seconds" ]; then
  fail_bucket "performance-budget" "Demo exceeded NFR-P2 budget: ${elapsed}s > ${max_seconds}s." "docs/troubleshooting.md#performance-budget"
fi

ok "Demo complete. Wall-clock: ${elapsed}s."
