#!/usr/bin/env bash
set -euo pipefail

AGENTS_PHASE3=".agents/skills/bad/references/subagents/phase3-merge.md"
CODEX_PHASE3=".codex/skills/bad/references/subagents/phase3-merge.md"

for prompt_path in "$AGENTS_PHASE3" "$CODEX_PHASE3"; do
  if [[ ! -f "$prompt_path" ]]; then
    echo "check-bad-skill-sync: missing $prompt_path" >&2
    exit 1
  fi
done

if ! cmp -s "$AGENTS_PHASE3" "$CODEX_PHASE3"; then
  echo "check-bad-skill-sync: phase3 merge prompts differ" >&2
  echo "  $AGENTS_PHASE3" >&2
  echo "  $CODEX_PHASE3" >&2
  exit 1
fi

echo "check-bad-skill-sync: OK"
