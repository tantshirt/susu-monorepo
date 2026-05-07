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
- Missing keys fail parity checks in CI.
- Keep nesting and key naming identical to the English source.

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
