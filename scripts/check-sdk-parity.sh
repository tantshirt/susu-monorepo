#!/usr/bin/env bash
# SDK parity against the frozen Codama IDL:
#   1. Regenerate TS + Rust `generated/` via `pnpm sdk:codegen` — committed trees must match.
#   2. Structural parity: exported instruction helpers, generated account typedefs,
#      and SusuError codes must match modulo Codama naming (Rust `snake_*` helpers vs
#      TS camelCase exports are compared via Rust `SusuInstructionKind` → camelCase).
set -euo pipefail

RUST_GEN_DIR="sdk/rust/src/generated"
TS_GEN_DIR="sdk/ts/src/generated"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ ! -d "$ROOT/$TS_GEN_DIR" ]]; then
  echo "check-sdk-parity: missing $TS_GEN_DIR" >&2
  exit 1
fi

if [[ ! -d "$ROOT/$RUST_GEN_DIR" ]]; then
  echo "check-sdk-parity: missing $RUST_GEN_DIR" >&2
  exit 1
fi

cd "$ROOT"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "check-sdk-parity: pnpm is required" >&2
  exit 1
fi

pnpm sdk:codegen

git diff --exit-code -- "$TS_GEN_DIR" "$RUST_GEN_DIR"

TS_TMP="$(mktemp)"
RS_TMP="$(mktemp)"
trap 'rm -f "$TS_TMP" "$RS_TMP"' EXIT

node "$ROOT/scripts/extract-ts-surface.mjs" >"$TS_TMP"
RUSTUP_TOOLCHAIN="${RUSTUP_TOOLCHAIN:-stable}" cargo run -p extract-rust-surface --quiet -- "$ROOT/$RUST_GEN_DIR" >"$RS_TMP"

node "$ROOT/scripts/compare-sdk-surfaces.mjs" "$TS_TMP" "$RS_TMP"

echo "check-sdk-parity: OK"
