#!/usr/bin/env bash
set -euo pipefail

START_EPOCH="$(date +%s)"
MAX_SECONDS="${SUSU_VERIFY_MAX_SECONDS:-600}"
COMMIT_SHA_VALUE="${COMMIT_SHA:-$(git rev-parse HEAD)}"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/susu-verify.XXXXXX")"
SUMMARY_FILE="${WORK_DIR}/summary.tsv"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

printf 'step\tseconds\tstatus\n' > "$SUMMARY_FILE"

run_step() {
  local name="$1"
  shift
  local log_file="${WORK_DIR}/${name//[^A-Za-z0-9_.-]/_}.log"
  local step_start
  local step_end
  local elapsed

  step_start="$(date +%s)"
  printf '==> %s\n' "$name"
  set +e
  "$@" >"$log_file" 2>&1
  local status=$?
  set -e
  step_end="$(date +%s)"
  elapsed=$((step_end - step_start))

  if [ "$status" -ne 0 ]; then
    printf '%s\t%s\tfail\n' "$name" "$elapsed" >> "$SUMMARY_FILE"
    printf '\nverify failed at step: %s (exit %s)\n' "$name" "$status" >&2
    printf '%s\n' '--- last 50 log lines ---' >&2
    tail -n 50 "$log_file" >&2 || true
    print_summary >&2
    exit "$status"
  fi

  printf '%s\t%s\tpass\n' "$name" "$elapsed" >> "$SUMMARY_FILE"
}

print_summary() {
  printf '\n%s\n' 'Susu verify summary'
  awk -F '\t' 'NR == 1 { printf "%-36s %8s %s\n", $1, $2, $3; next } { printf "%-36s %8ss %s\n", $1, $2, $3 }' "$SUMMARY_FILE"
}

run_step "pnpm install" pnpm install --frozen-lockfile
run_step "anchor build" env RUSTUP_TOOLCHAIN="${RUSTUP_TOOLCHAIN:-stable}" anchor build --ignore-keys
run_step "anchor test" env RUSTUP_TOOLCHAIN="${RUSTUP_TOOLCHAIN:-stable}" anchor test
run_step "cargo test workspace" env RUSTUP_TOOLCHAIN="${RUSTUP_TOOLCHAIN:-stable}" cargo test --workspace
run_step "adversary 10000 circles" env RUSTUP_TOOLCHAIN="${RUSTUP_TOOLCHAIN:-stable}" COMMIT_SHA="$COMMIT_SHA_VALUE" cargo run --bin susu-adversary --release -- --circles 10000 --seed "$COMMIT_SHA_VALUE" --cluster localnet --output "${WORK_DIR}/adversary-report.json"
run_step "susu demo" pnpm susu:demo
run_step "idl hash" bash scripts/check-idl-hash.sh
run_step "sdk parity" bash scripts/check-sdk-parity.sh
run_step "immutability" bash scripts/check-immutability.sh
run_step "i18n parity" pnpm exec tsx scripts/check-i18n-parity.ts

TOTAL_SECONDS=$(($(date +%s) - START_EPOCH))
print_summary

if [ "$TOTAL_SECONDS" -gt "$MAX_SECONDS" ]; then
  printf 'verify exceeded NFR-Re4 budget: %ss > %ss\n' "$TOTAL_SECONDS" "$MAX_SECONDS" >&2
  exit 1
fi

printf 'verify complete. Wall-clock: %ss.\n' "$TOTAL_SECONDS"
