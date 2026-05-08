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

handler_count="$({
  grep -rEl --include='*.rs' 'pub[[:space:]]+fn[[:space:]]+handler[[:space:]]*\(' "$INSTRUCTION_DIR" 2>/dev/null || true
} | wc -l | tr -d ' ')"
placeholder_count="$(
  for instruction_file in "$INSTRUCTION_DIR"/*.rs; do
    [[ -f "$instruction_file" ]] || continue
    perl -0ne '
      s{//[^\n]*}{}g;
      s{/\*.*?\*/}{}gs;
      print "$ARGV\n" if /\bpub\s+fn\s+handler\s*\([^{}]*\)\s*->\s*Result\s*<\s*\(\s*\)\s*>\s*\{\s*Ok\s*\(\s*\(\s*\)\s*\)\s*\}/s;
    ' "$instruction_file"
  done | wc -l | tr -d ' '
)"
if [[ "$handler_count" -gt 0 && "$placeholder_count" -eq "$handler_count" ]]; then
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

non_pda_init_hits="$(
  for instruction_file in "$INSTRUCTION_DIR"/*.rs; do
    [[ -f "$instruction_file" ]] || continue
    perl -0ne '
      while (/#\[account\((.*?)\)\]\s*pub\s+([A-Za-z0-9_]+):/gs) {
        my ($attr, $account) = ($1, $2);
        next unless $attr =~ /\binit\b/s && $attr =~ /token::authority\s*=\s*([^,\)]+)/s;
        my $authority = $1;
        $authority =~ s/^\s+|\s+$//g;
        next if $attr =~ /\bseeds\s*=/s || $authority =~ /\b(?:group|vault_authority|pda)\b/;
        my $line = substr($_, 0, $-[0]) =~ tr/\n//;
        $line += 1;
        print "$ARGV:$line: account $account initializes token account with authority $authority\n";
      }
    ' "$instruction_file"
  done
)"
report_violations "token-account-init-authority" "$non_pda_init_hits"

risky_transfer_hits="$(
  for instruction_file in "$INSTRUCTION_DIR"/*.rs; do
    [[ -f "$instruction_file" ]] || continue
    perl -0ne '
      while (/\btoken::transfer(?:_checked)?\s*\(/g) {
        my $start = $-[0];
        my $line = substr($_, 0, $start) =~ tr/\n//;
        $line += 1;
        my $before_start = $start > 700 ? $start - 700 : 0;
        my $context = substr($_, $before_start, 1400);
        next if $context =~ /to:\s*(?:ctx\.accounts\.)?vault\b/s;
        next if $context =~ /to:\s*(?:ctx\.accounts\.)?member_token_account\b/s;
        next if $context =~ /to:\s*ata_ai\.to_account_info\(\)/s;
        next if $context =~ /\brecipient\b/s;
        print "$ARGV:$line: token transfer without approved collateral destination\n";
      }
    ' "$instruction_file"
  done
)"
report_violations "transfer-destination" "$risky_transfer_hits"

non_allowlisted_cpi_hits="$(
  for instruction_file in "$INSTRUCTION_DIR"/*.rs; do
    [[ -f "$instruction_file" ]] || continue
    perl -0ne '
      while (/(?:invoke_signed\(|invoke\(|CpiContext::new(?:_with_signer)?\()/g) {
        my $start = $-[0];
        my $line = substr($_, 0, $start) =~ tr/\n//;
        $line += 1;
        my $context = substr($_, $start, 900);
        next if $context =~ /\b(?:spl_token|token_program|token_program_id|associated_token_program)\b/s;
        print "$ARGV:$line: CPI without allowlisted program in local context\n";
      }
    ' "$instruction_file"
  done
)"
report_violations "cpi-allowlist" "$non_allowlisted_cpi_hits"

if [[ "$failures" -ne 0 ]]; then
  exit 1
fi

echo "check-fincen-posture: OK"
