#!/usr/bin/env bash
# scripts/sync-latest-log.sh
#
# Keeps log/latest.md in sync with the most recent log/YYYY-MM-DD.md daily entry.
# README.md links to log/latest.md (Story 8.5 / FR53) so judges and forking devs
# always land on today's log without us hand-editing the URL.
#
# Usage:
#   bash scripts/sync-latest-log.sh           # idempotent; copies if changed
#
# Behavior:
#   - Finds the highest-sorted log/YYYY-MM-DD.md (lexicographic sort works for ISO dates).
#   - Copies its content into log/latest.md (regular file, not a symlink — Windows-friendly).
#   - Exits 0 if log/latest.md was already up to date.
#   - Exits non-zero if no daily log entry is found.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

LATEST_LINK="log/latest.md"

# Find the highest-sorted ISO-dated daily log entry. ISO YYYY-MM-DD sorts
# correctly with plain `sort`, so we just take the last one.
LATEST_ENTRY="$(ls log/*.md 2>/dev/null | grep -E 'log/[0-9]{4}-[0-9]{2}-[0-9]{2}\.md$' | sort | tail -n 1 || true)"

if [ -z "${LATEST_ENTRY}" ]; then
  echo "sync-latest-log: no log/YYYY-MM-DD.md entries found under log/" >&2
  exit 1
fi

if [ -f "$LATEST_LINK" ] && cmp -s "$LATEST_ENTRY" "$LATEST_LINK"; then
  echo "sync-latest-log: log/latest.md already mirrors $LATEST_ENTRY"
  exit 0
fi

cp "$LATEST_ENTRY" "$LATEST_LINK"
echo "sync-latest-log: copied $LATEST_ENTRY -> $LATEST_LINK"
