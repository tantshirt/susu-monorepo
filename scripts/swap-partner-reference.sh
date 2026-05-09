#!/usr/bin/env bash
# scripts/swap-partner-reference.sh
#
# Story 8.7 — flip the README link cluster's partner row from a placeholder to
# a real partner reference URL once a partner publicly cites Susu, OR drop
# the row entirely if no partner confirms by submission close (per PRD
# nice-to-have cut #5).
#
# Usage:
#   ./scripts/swap-partner-reference.sh --partner <name> --url <url>
#   ./scripts/swap-partner-reference.sh --drop
#
# Targets the <!-- susu:linkcluster:partner --> ... <!-- /susu:linkcluster:partner -->
# block inside the README link cluster (Story 8.5 / Story 8.7).
#
# Idempotent: safe to re-run. The block boundaries are restored on every
# successful swap, so a second --partner run replaces the previous URL cleanly.

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/swap-partner-reference.sh --partner <name> --url <url>
  scripts/swap-partner-reference.sh --drop

Flags:
  --partner   Partner display name (e.g. "Squads", "Privy", "Helius", "Token Extensions").
  --url       Public partner URL (tweet, doc page, reference letter — must include scheme).
  --drop      Remove the partner row (and its sentinels) entirely from the link cluster.
  -h, --help  Show this help.
USAGE
}

PARTNER=""
URL=""
DROP=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --partner)
      PARTNER="${2:-}"
      shift 2
      ;;
    --url)
      URL="${2:-}"
      shift 2
      ;;
    --drop)
      DROP=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown flag: $1" >&2
      usage
      exit 2
      ;;
  esac
done

# Locate README.md by walking up from the script's directory until we find
# the linkcluster sentinel — keeps the script callable from anywhere.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"
while [[ "$REPO_ROOT" != "/" ]]; do
  if [[ -f "$REPO_ROOT/README.md" ]] && grep -q "susu:linkcluster:start" "$REPO_ROOT/README.md" 2>/dev/null; then
    break
  fi
  REPO_ROOT="$(dirname "$REPO_ROOT")"
done

README="$REPO_ROOT/README.md"
if [[ ! -f "$README" ]]; then
  echo "error: README.md with linkcluster sentinel not found from $SCRIPT_DIR upward" >&2
  exit 1
fi

if ! grep -q "susu:linkcluster:partner" "$README"; then
  echo "error: README.md is missing the <!-- susu:linkcluster:partner --> sentinel" >&2
  exit 1
fi

START_TAG="<!-- susu:linkcluster:partner -->"
END_TAG="<!-- /susu:linkcluster:partner -->"

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

if [[ "$DROP" == "1" ]]; then
  if [[ -n "$PARTNER" || -n "$URL" ]]; then
    echo "error: --drop is mutually exclusive with --partner / --url" >&2
    exit 2
  fi
  # Remove the entire block including both sentinel comments.
  awk -v start="$START_TAG" -v end="$END_TAG" '
    BEGIN { skip = 0 }
    {
      if (index($0, start) > 0) { skip = 1; next }
      if (skip && index($0, end) > 0) { skip = 0; next }
      if (!skip) print
    }
  ' "$README" > "$TMP"
  mv "$TMP" "$README"
  trap - EXIT
  echo "swap-partner-reference: dropped partner row from $README"
  exit 0
fi

if [[ -z "$PARTNER" || -z "$URL" ]]; then
  echo "error: --partner and --url are both required (or pass --drop)" >&2
  usage
  exit 2
fi

# Cheap URL sanity: must start with http:// or https://.
if [[ ! "$URL" =~ ^https?:// ]]; then
  echo "error: --url must include scheme (http:// or https://)" >&2
  exit 2
fi

NEW_ROW="| Ecosystem partner reference — ${PARTNER} | [${URL}](${URL}) |"

# Replace the entire block (sentinels + whatever rows live inside) with a
# fresh sentinel-bracketed single-row block. Idempotent: re-running produces
# the same shape regardless of prior contents.
awk -v start="$START_TAG" -v end="$END_TAG" -v new_row="$NEW_ROW" '
  BEGIN { skip = 0 }
  {
    if (index($0, start) > 0) {
      print start
      print new_row
      print end
      skip = 1
      next
    }
    if (skip && index($0, end) > 0) { skip = 0; next }
    if (!skip) print
  }
' "$README" > "$TMP"
mv "$TMP" "$README"
trap - EXIT
echo "swap-partner-reference: set partner row to ${PARTNER} -> ${URL}"
