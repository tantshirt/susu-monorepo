#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LEGAL_HANDOFF_OUT="${LEGAL_HANDOFF_OUT:-output_susu/legal-handoff}"
OUT_DIR="$ROOT/$LEGAL_HANDOFF_OUT"
DATE_STAMP="${LEGAL_HANDOFF_DATE:-2026-05-08}"
BUNDLE="$OUT_DIR/susu-legal-handoff-$DATE_STAMP.tar.gz"
MANIFEST="$OUT_DIR/manifest-$DATE_STAMP.txt"
DRY_RUN=0

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

inputs=(
  "docs/legal-engagement.md"
  "docs/legal-sow-summary.md"
  "docs/fincen-cvc-framing.md"
  "docs/threat-model.md"
  "docs/architecture-notes.md"
  "programs/susu/idl/susu.json"
  "programs/susu/src/state"
  "IDL_FREEZE.md"
  "scripts/check-fincen-posture.sh"
)

missing=0
for input in "${inputs[@]}"; do
  if [[ ! -e "$ROOT/$input" ]]; then
    echo "legal-handoff: missing required input: $input" >&2
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

echo "legal-handoff: output directory: $LEGAL_HANDOFF_OUT"
printf 'legal-handoff: include %s\n' "${inputs[@]}"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "legal-handoff: dry run only, no bundle written"
  exit 0
fi

mkdir -p "$OUT_DIR"
{
  echo "Susu legal handoff bundle"
  echo "Date: $DATE_STAMP"
  echo "Scope: non-custodial / non-fee / non-yield posture under FinCEN FIN-2019-G001"
  echo
  printf '%s\n' "${inputs[@]}"
} > "$MANIFEST"

tar -C "$ROOT" -czf "$BUNDLE" "${inputs[@]}" "${MANIFEST#"$ROOT/"}"

echo "legal-handoff: wrote $BUNDLE"
echo "legal-handoff: transient output is intentionally under $LEGAL_HANDOFF_OUT"
