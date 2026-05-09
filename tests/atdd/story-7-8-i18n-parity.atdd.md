# Story 7.8 — i18n parity check + workflow + CONTRIBUTING-TRANSLATIONS

## Acceptance criteria (re-derived from issue #72)

- `scripts/check-i18n-parity.ts` reads `apps/reference/messages/en.json` as source of truth and asserts every other locale file (`vi`, `ar`, `es`, `yo`, `ht-kreyol`) has the identical recursive key set.
- Missing keys cause non-zero exit with a structured `(locale, missing_key)` listing.
- Extra keys present in non-English locales also fail.
- `.github/workflows/i18n-parity.yml` runs the parity check on every PR / push affecting `apps/reference/messages/**` or the script itself.
- `CONTRIBUTING-TRANSLATIONS.md` documents the parity-check error format and the recovery workflow, plus stub-vs-live status, ICU notes, and `pnpm i18n:check`.
- Root `package.json` exposes `pnpm i18n:check` so contributors can reproduce CI locally.

## Test plan

Static red test asserts:

1. `scripts/check-i18n-parity.ts` exists and references `messages/en.json`.
2. `.github/workflows/i18n-parity.yml` exists, triggers on `apps/reference/messages/**` and `scripts/check-i18n-parity*`, and runs `pnpm i18n:check`.
3. `package.json` defines `i18n:check` script.
4. `CONTRIBUTING-TRANSLATIONS.md` contains required sections: parity-check error format, recovery workflow, ICU MessageFormat, stub vs live, pnpm i18n:check, attribution.
5. Running `pnpm i18n:check` against the current tree exits 0.
