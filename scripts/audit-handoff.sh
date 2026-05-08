#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: bash scripts/audit-handoff.sh [--source-root PATH] [--output-dir PATH] [--date YYYY-MM-DD] [--firm SLUG] [--allow-missing]

Creates an audit handoff tarball containing the frozen IDL, invariant/adversary evidence,
threat/compliance docs, and architecture context. The tarball and manifest are gitignored
per-engagement transfer artifacts.
USAGE
}

source_root="."
output_dir="audits"
handoff_date="$(date -u +%F)"
firm_slug="primary-audit-firm"
allow_missing=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --source-root)
      source_root="${2:-}"
      shift 2
      ;;
    --output-dir)
      output_dir="${2:-}"
      shift 2
      ;;
    --date)
      handoff_date="${2:-}"
      shift 2
      ;;
    --firm)
      firm_slug="${2:-}"
      shift 2
      ;;
    --allow-missing)
      allow_missing=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ -z "$source_root" ] || [ -z "$output_dir" ] || [ -z "$handoff_date" ] || [ -z "$firm_slug" ]; then
  echo "source root, output dir, date, and firm slug must be non-empty" >&2
  exit 2
fi

case "$handoff_date" in
  ????-??-??) ;;
  *)
    echo "--date must use YYYY-MM-DD format" >&2
    exit 2
    ;;
esac

source_root="${source_root%/}"
output_dir="${output_dir%/}"
tarball="${output_dir}/handoff-${handoff_date}.tar.gz"
manifest="${output_dir}/handoff-${handoff_date}.MANIFEST.txt"

required_paths=(
  "IDL_FREEZE.md"
  "programs/susu/idl/susu.json"
  "tests/invariants/no_strategic_default.rs"
  "audits/adversary/adversary-report.json"
  "docs/threat-model.md"
  "tests/coverage/threat-model.md"
  "docs/collateral-curve.md"
  "docs/fincen-cvc-framing.md"
  "output_susu/planning-artifacts/architecture.md"
)

missing=()
for path in "${required_paths[@]}"; do
  if [ ! -f "${source_root}/${path}" ]; then
    missing+=("$path")
  fi
done

if [ "${#missing[@]}" -gt 0 ] && [ "$allow_missing" -ne 1 ]; then
  echo "audit handoff is missing required artifacts:" >&2
  printf '  - %s\n' "${missing[@]}" >&2
  echo "rerun with --allow-missing only for preflight while concurrent Epic 5 artifacts are still landing" >&2
  exit 1
fi

mkdir -p "$output_dir"
staging="$(mktemp -d)"
cleanup() {
  rm -rf "$staging"
}
trap cleanup EXIT

bundle_root="${staging}/susu-audit-handoff-${handoff_date}"
mkdir -p "$bundle_root"

{
  echo "Susu Protocol audit handoff"
  echo "firm: ${firm_slug}"
  echo "date: ${handoff_date}"
  if git -C "$source_root" rev-parse HEAD >/dev/null 2>&1; then
    echo "source_commit: $(git -C "$source_root" rev-parse HEAD)"
  else
    echo "source_commit: unavailable"
  fi
  echo
  echo "included_artifacts:"
} >"${bundle_root}/AUDIT_HANDOFF_MANIFEST.txt"

for path in "${required_paths[@]}"; do
  if [ -f "${source_root}/${path}" ]; then
    mkdir -p "${bundle_root}/$(dirname "$path")"
    cp "${source_root}/${path}" "${bundle_root}/${path}"
    echo "  - ${path}" >>"${bundle_root}/AUDIT_HANDOFF_MANIFEST.txt"
  fi
done

if [ "${#missing[@]}" -gt 0 ]; then
  {
    echo
    echo "missing_artifacts:"
    printf '  - %s\n' "${missing[@]}"
  } >>"${bundle_root}/AUDIT_HANDOFF_MANIFEST.txt"
fi

cp "${bundle_root}/AUDIT_HANDOFF_MANIFEST.txt" "$manifest"
tar -C "$staging" -czf "$tarball" "$(basename "$bundle_root")"

echo "created ${tarball}"
echo "created ${manifest}"
