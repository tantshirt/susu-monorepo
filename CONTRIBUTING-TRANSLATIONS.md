# Contributing Translations

Susu Protocol translation work is community-first and culture-aware. Accuracy, dignity, and local idiom matter more than direct literal conversion.

## Bundle Structure

Locale bundles live in:

- `apps/reference/messages/en.json` (source of truth)
- `apps/reference/messages/vi.json`
- `apps/reference/messages/ar.json`
- `apps/reference/messages/es.json`
- `apps/reference/messages/yo.json`
- `apps/reference/messages/ht-kreyol.json`

## Locale Stub Layout

- Every key present in `en.json` must exist in every locale file.
- Missing keys and extra keys fail parity checks in CI.
- Keep nesting and key naming identical to the English source.
- ICU MessageFormat strings are checked at the translation key level only (not plural/select branch internals).

## Parity Check Error Format

The parity script is `scripts/check-i18n-parity.ts` and CI runs it in `.github/workflows/i18n-parity.yml`.

On failure it exits with code `1` and prints:

```text
check-i18n-parity: parity check failed
[
  { "locale": "<locale>", "missing_key": "<dot.path>" },
  { "locale": "<locale>", "extra_key": "<dot.path>" }
]
```

## Recovery Workflow

1. Run `node scripts/check-i18n-parity.ts` locally.
2. For each `missing_key`, add the key to the locale bundle with the same nesting as `en.json`.
3. For each `extra_key`, remove it from the locale bundle (or add the matching key in `en.json` first if English is intentionally expanding).
4. Re-run `node scripts/check-i18n-parity.ts` until it prints `check-i18n-parity: OK`.
5. Push your translation updates so PR CI can confirm parity.

## Auto-translation Prohibition

Machine-generated translation output is not accepted for committed locale files.

- Do not submit content produced by Google Translate, DeepL, or LLM auto-translation.
- Human translators with lived language context are required.
- Reviewers may request rewrite when phrasing appears machine-generated or culturally off.

## Style Guide and Term Mapping

- English anchor term: `savings circle`.
- Locale communities choose culturally accurate equivalents.
- Known examples include terms such as `tanda` (Spanish), `hụi` (Vietnamese), `ajo` (Yoruba), and `sangken` (Haitian Creole).
- Preserve trust, mutual aid, and non-custodial meaning in every locale.

## Translation PR Template

Use the translation intake template at [`.github/ISSUE_TEMPLATE/translation_pr.md`](./.github/ISSUE_TEMPLATE/translation_pr.md) and include the same checklist in your PR description.

## Recognition Path

After one accepted translation PR with accurate cultural phrasing and full key parity, contributors can be added as CODEOWNERS for their locale path.
