#!/usr/bin/env bash
set -euo pipefail

IDL_PATH="programs/susu/idl/susu.json"
FREEZE_PATH="IDL_FREEZE.md"

if [[ ! -f "$IDL_PATH" ]]; then
  echo "check-idl-hash: missing $IDL_PATH" >&2
  exit 1
fi

if [[ ! -f "$FREEZE_PATH" ]]; then
  echo "check-idl-hash: missing $FREEZE_PATH (expected Story 1.2 artifact)" >&2
  exit 1
fi

if command -v shasum >/dev/null 2>&1; then
  actual_hash="$(shasum -a 256 "$IDL_PATH" | awk '{print $1}')"
elif command -v sha256sum >/dev/null 2>&1; then
  actual_hash="$(sha256sum "$IDL_PATH" | awk '{print $1}')"
else
  echo "check-idl-hash: neither shasum nor sha256sum is available" >&2
  exit 1
fi

expected_hash="$(grep -Eio '[a-f0-9]{64}' "$FREEZE_PATH" | head -n 1 || true)"

if [[ -z "$expected_hash" ]]; then
  echo "check-idl-hash: no SHA-256 hash found in $FREEZE_PATH" >&2
  exit 1
fi

if [[ "$actual_hash" != "$expected_hash" ]]; then
  echo "check-idl-hash: IDL hash mismatch" >&2
  echo "  expected: $expected_hash" >&2
  echo "  actual:   $actual_hash" >&2
  echo "  file:     $IDL_PATH" >&2
  exit 1
fi

echo "check-idl-hash: OK ($actual_hash)"
