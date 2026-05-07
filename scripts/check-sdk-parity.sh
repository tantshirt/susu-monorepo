#!/usr/bin/env bash
set -euo pipefail

RUST_GEN_DIR="sdk/rust/src/generated"
TS_GEN_DIR="sdk/ts/src/generated"

if [[ ! -d "$RUST_GEN_DIR" ]] || [[ -z "$(find "$RUST_GEN_DIR" -type f -maxdepth 1 2>/dev/null)" ]]; then
  echo "check-sdk-parity: vacuously passing (Rust generated SDK is empty or absent)"
  exit 0
fi

if [[ ! -d "$TS_GEN_DIR" ]]; then
  echo "check-sdk-parity: missing $TS_GEN_DIR" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "check-sdk-parity: pnpm is required to run code generation" >&2
  exit 1
fi

pnpm sdk:codegen

git diff --exit-code -- "$TS_GEN_DIR" "$RUST_GEN_DIR"

echo "check-sdk-parity: OK"
