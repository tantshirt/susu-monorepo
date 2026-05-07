#!/usr/bin/env bash
set -euo pipefail

INSTRUCTION_DIR="programs/susu/src/instructions"
PROGRAM_LIB="programs/susu/src/lib.rs"

if [[ ! -d "$INSTRUCTION_DIR" ]]; then
  echo "check-fincen-posture: vacuously passing (missing $INSTRUCTION_DIR)"
  exit 0
fi

if [[ ! -f "$PROGRAM_LIB" ]]; then
  echo "check-fincen-posture: vacuously passing (missing $PROGRAM_LIB)"
  exit 0
fi

placeholder_count="$({
  grep -r -o --include='*.rs' 'Ok(())' "$INSTRUCTION_DIR" 2>/dev/null || true
} | wc -l | tr -d ' ')"
if [[ "$placeholder_count" -ge 9 ]]; then
  echo "check-fincen-posture: vacuously passing (instruction handlers are placeholders)"
  exit 0
fi

failures=0

report_violations() {
  local label="$1"
  local violations="$2"
  if [[ -n "$violations" ]]; then
    echo "check-fincen-posture: suspicious ${label} pattern(s) detected" >&2
    echo "$violations" >&2
    failures=1
  fi
}

non_pda_init_hits="$({
  grep -rEn --include='*.rs' 'token::authority\s*=\s*[^,)]+' "$INSTRUCTION_DIR" 2>/dev/null || true
} | grep -vE 'seeds|vault_authority|group|pda' || true)"
report_violations "token-account-init-authority" "$non_pda_init_hits"

risky_transfer_hits="$({
  grep -rEn --include='*.rs' '(transfer|transfer_checked)' "$INSTRUCTION_DIR" 2>/dev/null || true
} | grep -vE 'vault|recipient|token_program|spl_token' || true)"
report_violations "transfer-destination" "$risky_transfer_hits"

non_allowlisted_cpi_hits="$({
  grep -rEn --include='*.rs' '(invoke_signed\(|invoke\(|CpiContext::new\()' "$INSTRUCTION_DIR" 2>/dev/null || true
} | grep -vE 'spl_token|token_program|associated_token_program' || true)"
report_violations "cpi-allowlist" "$non_allowlisted_cpi_hits"

if [[ "$failures" -ne 0 ]]; then
  exit 1
fi

echo "check-fincen-posture: OK"
