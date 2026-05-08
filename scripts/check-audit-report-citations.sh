#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: bash scripts/check-audit-report-citations.sh audits/{firm-slug}-{YYYY-MM}.pdf" >&2
}

if [ "$#" -ne 1 ]; then
  usage
  exit 2
fi

report="$1"
if [ ! -f "$report" ]; then
  echo "audit report not found: ${report}" >&2
  exit 1
fi

tmp_text="$(mktemp)"
cleanup() {
  rm -f "$tmp_text"
}
trap cleanup EXIT

if command -v pdftotext >/dev/null 2>&1 && pdftotext "$report" "$tmp_text" >/dev/null 2>&1; then
  :
elif command -v strings >/dev/null 2>&1; then
  strings "$report" >"$tmp_text"
else
  python3 - "$report" "$tmp_text" <<'PY'
from pathlib import Path
import sys

source = Path(sys.argv[1]).read_bytes()
Path(sys.argv[2]).write_text(source.decode("utf-8", errors="ignore"), encoding="utf-8")
PY
fi

required_paths=(
  "tests/invariants/no_strategic_default.rs"
  "audits/adversary/adversary-report.json"
)

missing=()
for path in "${required_paths[@]}"; do
  if ! grep -Fq "$path" "$tmp_text"; then
    missing+=("$path")
  fi
done

if [ "${#missing[@]}" -gt 0 ]; then
  echo "audit report is missing required NFR-S1 citations:" >&2
  printf '  - %s\n' "${missing[@]}" >&2
  exit 1
fi

echo "audit report citation check passed: ${report}"
