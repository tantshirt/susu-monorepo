#!/usr/bin/env bash
set -euo pipefail

CIRCLES="${CIRCLES:-10000}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-600}"
SEED="${COMMIT_SHA:-${GITHUB_SHA:-$(git rev-parse HEAD)}}"
WORK_DIR="target/adversary-determinism"
FIRST_REPORT="${WORK_DIR}/first/adversary-report.json"
SECOND_REPORT="${WORK_DIR}/second/adversary-report.json"

rm -rf "${WORK_DIR}"
mkdir -p "$(dirname "${FIRST_REPORT}")" "$(dirname "${SECOND_REPORT}")"

run_report() {
  local output_path="$1"
  local command=(
    cargo run --bin susu-adversary --release --
    --circles "${CIRCLES}"
    --seed "${SEED}"
    --cluster localnet
    --output "${output_path}"
  )

  if command -v timeout >/dev/null 2>&1; then
    timeout "${TIMEOUT_SECONDS}" "${command[@]}"
  else
    "${command[@]}"
  fi
}

run_report "${FIRST_REPORT}"
run_report "${SECOND_REPORT}"

cmp -s "${FIRST_REPORT}" "${SECOND_REPORT}"

node -e '
const fs = require("node:fs");
const report = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
if (report.summary.max_defector_profit_lamports !== 0) {
  throw new Error(`max_defector_profit_lamports=${report.summary.max_defector_profit_lamports}`);
}
if (!report.summary.scenarios_covered.includes("30_percent_cartel")) {
  throw new Error("30_percent_cartel missing from scenarios_covered");
}
' "${FIRST_REPORT}"

printf 'adversary report deterministic for %s circles with seed %s\n' "${CIRCLES}" "${SEED}"
