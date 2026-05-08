#!/usr/bin/env bash
set -euo pipefail

failures=0

print_hits() {
  local label="$1"
  local hits="$2"
  if [[ -n "$hits" ]]; then
    echo "check-patterns: forbidden pattern detected (${label})" >&2
    echo "$hits" >&2
    failures=1
  fi
}

seed_hits="$({
  grep -rEn --include='*.rs' 'b"(group|member|vault|rotation)"' programs sdk crates apps 2>/dev/null || true
} \
  | grep -v '^programs/susu/src/seeds.rs:' \
  | grep -v '^sdk/rust/src/generated/' \
  || true)"
print_hits "seed literal outside seeds.rs" "$seed_hits"

convex_hits="$({
  grep -rEn --include='*.ts' --include='*.tsx' "from[[:space:]]+['\"](convex|convex/react|@convex-dev/[^'\"]+)['\"]" apps sdk examples 2>/dev/null || true
} \
  | grep -v '^apps/reference/lib/convex/' \
  | grep -v '^sdk/ts/src/generated/' \
  || true)"
print_hits "convex import outside apps/reference/lib/convex" "$convex_hits"

directional_hits="$({
  grep -rEn --include='*.ts' --include='*.tsx' --include='*.css' '\b(ml-|mr-|pl-|pr-|left-|right-)[0-9]+' apps 2>/dev/null || true
} | grep -v '^apps/reference/messages/' || true)"
print_hits "directional Tailwind classes" "$directional_hits"

env_hits="$({
  grep -rEn --include='*.ts' --include='*.tsx' 'process\.env\.[A-Za-z_][A-Za-z0-9_]*' apps sdk examples 2>/dev/null || true
} \
  | grep -v '^apps/reference/lib/env.ts:' \
  | grep -v '^sdk/ts/src/generated/' \
  || true)"
print_hits "process.env outside apps/reference/lib/env.ts" "$env_hits"

sdk_bare_error_hits="$({
  grep -rEn --include='*.ts' 'throw[[:space:]]+new[[:space:]]+Error[[:space:]]*\(' sdk/ts/src 2>/dev/null || true
} | grep -v '^sdk/ts/src/generated/' || true)"
print_hits "bare Error throw in sdk/ts/src" "$sdk_bare_error_hits"

sdk_string_reject_hits="$({
  grep -rEn --include='*.ts' 'Promise\.reject[[:space:]]*\([[:space:]]*['"'"'"`]' sdk/ts/src 2>/dev/null || true
} | grep -v '^sdk/ts/src/generated/' || true)"
print_hits "string Promise.reject in sdk/ts/src" "$sdk_string_reject_hits"

if [[ "$failures" -ne 0 ]]; then
  exit 1
fi

echo "check-patterns: OK"
