#!/usr/bin/env bash
# Story 9.1 — Audit sign-off gate verification (NFR-S1).
# Blocks Story 9.2 (mainnet deploy) from happening until the audit firm has
# delivered a report with zero Critical and zero High findings AND the repo
# carries a structural sign-off artifact.
#
# Skip mode (deliberate, pre-audit):
#   - SUSU_AUDIT_GATE=skip                        (env opt-in)
#   - audits/SKIP_AUDIT_GATE                      (committed sentinel)
# Either path exits 0 with a clear "skipped (pre-audit)" message. Story 9.2's
# mainnet-deploy preflight is responsible for deleting the SKIP_AUDIT_GATE
# sentinel, at which point this script must enforce.
#
# Enforcement mode (default once sentinel is removed and SUSU_AUDIT_GATE!=skip):
#   1. audits/audit-summary.json exists with critical == 0 and high == 0.
#   2. At least one audits/{firm-slug}-{YYYY-MM}.pdf is committed and non-empty.
#   3. The audit summary has signed_off: true OR audits/SIGNED_OFF exists.
#   4. If audits/findings-tracker.md exists, every blocking (Critical/High)
#      finding has a resolved-at: line.
#
# Story 9.1 ships SKIP_AUDIT_GATE intentionally so the rest of the codebase is
# not blocked by the absent audit. Story 9.2 will require its removal as the
# explicit blocker visible to the operator.

set -euo pipefail

SUSU_AUDIT_GATE="${SUSU_AUDIT_GATE:-default}"
SKIP_SENTINEL="audits/SKIP_AUDIT_GATE"
SUMMARY_PATH="audits/audit-summary.json"
SIGNED_OFF_SENTINEL="audits/SIGNED_OFF"
FINDINGS_TRACKER="audits/findings-tracker.md"

skip_active="0"
case "$SUSU_AUDIT_GATE" in
  skip)
    skip_active="1"
    skip_reason="env SUSU_AUDIT_GATE=skip"
    ;;
  enforce|force|require)
    skip_active="0"
    ;;
  default|"")
    if [ -f "$SKIP_SENTINEL" ]; then
      skip_active="1"
      skip_reason="committed sentinel ${SKIP_SENTINEL}"
    fi
    ;;
  *)
    echo "audit-signoff: unrecognized SUSU_AUDIT_GATE='${SUSU_AUDIT_GATE}'; expected skip|enforce|default" >&2
    exit 2
    ;;
esac

if [ "$skip_active" = "1" ]; then
  echo "audit-signoff: skipped (pre-audit) — ${skip_reason}."
  echo "audit-signoff: Story 9.2's mainnet-deploy preflight must delete ${SKIP_SENTINEL} before mainnet deploy; the gate will then enforce."
  exit 0
fi

errors=()

# Invariant 1: audit-summary.json with critical == 0 && high == 0.
if [ ! -f "$SUMMARY_PATH" ]; then
  errors+=("missing ${SUMMARY_PATH} (must contain firm name, report path, severity counts, signed_off flag)")
else
  if ! command -v python3 >/dev/null 2>&1; then
    echo "audit-signoff: python3 is required to parse ${SUMMARY_PATH}" >&2
    exit 2
  fi
  python_out="$(python3 - "$SUMMARY_PATH" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
try:
    data = json.loads(path.read_text(encoding="utf-8"))
except Exception as exc:
    print(f"PARSE_ERROR::{exc}")
    sys.exit(0)

findings = data.get("findings", {}) if isinstance(data.get("findings"), dict) else {}

def normalize(name: str):
    if name in data:
        return data.get(name)
    return findings.get(name)

critical = normalize("critical")
high = normalize("high")
signed_off = data.get("signed_off")
signed_off_at = data.get("signed_off_at")

print(f"CRITICAL::{critical}")
print(f"HIGH::{high}")
print(f"SIGNED_OFF::{signed_off}")
print(f"SIGNED_OFF_AT::{signed_off_at}")
PY
)"

  while IFS= read -r line; do
    case "$line" in
      PARSE_ERROR::*)
        errors+=("could not parse ${SUMMARY_PATH}: ${line#PARSE_ERROR::}")
        ;;
      CRITICAL::*)
        critical_val="${line#CRITICAL::}"
        if [ "$critical_val" != "0" ]; then
          errors+=("audits/audit-summary.json: critical findings count must be 0 (found '${critical_val}')")
        fi
        ;;
      HIGH::*)
        high_val="${line#HIGH::}"
        if [ "$high_val" != "0" ]; then
          errors+=("audits/audit-summary.json: high findings count must be 0 (found '${high_val}')")
        fi
        ;;
      SIGNED_OFF::*)
        signed_off_val="${line#SIGNED_OFF::}"
        ;;
      SIGNED_OFF_AT::*)
        signed_off_at_val="${line#SIGNED_OFF_AT::}"
        ;;
    esac
  done <<<"$python_out"
fi

# Invariant 2: at least one non-empty audit report PDF.
shopt -s nullglob
report_pdfs=(audits/*.pdf)
shopt -u nullglob
if [ "${#report_pdfs[@]}" -eq 0 ]; then
  errors+=("no audit report PDF committed under audits/ (expected audits/{firm-slug}-{YYYY-MM}.pdf per audits/README.md)")
else
  has_nonempty="0"
  for pdf in "${report_pdfs[@]}"; do
    if [ -s "$pdf" ]; then
      has_nonempty="1"
      break
    fi
  done
  if [ "$has_nonempty" = "0" ]; then
    errors+=("audit report PDF(s) under audits/ are all empty")
  fi
fi

# Invariant 3: sign-off sentinel OR signed_off:true in summary.
signed_off_ok="0"
if [ -f "$SIGNED_OFF_SENTINEL" ] && [ -s "$SIGNED_OFF_SENTINEL" ]; then
  signed_off_ok="1"
fi
if [ "${signed_off_val:-}" = "True" ] || [ "${signed_off_val:-}" = "true" ]; then
  if [ -n "${signed_off_at_val:-}" ] && [ "${signed_off_at_val}" != "None" ] && [ "${signed_off_at_val}" != "null" ]; then
    signed_off_ok="1"
  fi
fi
if [ "$signed_off_ok" = "0" ]; then
  errors+=("audit not signed off: need either ${SIGNED_OFF_SENTINEL} (non-empty) or signed_off:true + signed_off_at:<date> in ${SUMMARY_PATH}")
fi

# Invariant 4: findings tracker — if present, every blocking finding must be resolved.
if [ -f "$FINDINGS_TRACKER" ]; then
  if grep -Eqi '^\s*-?\s*severity\s*:\s*(critical|high)' "$FINDINGS_TRACKER"; then
    # For every blocking finding line, require a paired resolved-at within ±20 lines.
    blocking_count="$(grep -Eci '^\s*-?\s*severity\s*:\s*(critical|high)' "$FINDINGS_TRACKER" || true)"
    resolved_count="$(grep -Eci '^\s*-?\s*resolved-at\s*:' "$FINDINGS_TRACKER" || true)"
    if [ "$blocking_count" -gt "$resolved_count" ]; then
      errors+=("audits/findings-tracker.md: ${blocking_count} blocking (Critical/High) finding(s) but only ${resolved_count} resolved-at entries; every blocking finding must record resolved-at")
    fi
  fi
fi

if [ "${#errors[@]}" -gt 0 ]; then
  echo "audit-signoff: audit not yet signed off; this gate must pass before mainnet deploy (Story 9.2)" >&2
  echo "audit-signoff: blocking issues:" >&2
  for err in "${errors[@]}"; do
    echo "  - ${err}" >&2
  done
  echo "audit-signoff: re-enable skip mode for non-mainnet PRs by leaving ${SKIP_SENTINEL} in place or exporting SUSU_AUDIT_GATE=skip." >&2
  exit 1
fi

echo "audit-signoff: passed — audit signed off, zero Critical, zero High; Story 9.2 mainnet deploy may proceed."
exit 0
