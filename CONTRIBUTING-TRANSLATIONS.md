# Contributing Translations

Susu Protocol translation work is community-first and culture-aware. Accuracy, dignity, and local idiom matter more than direct literal conversion.

## Supported locales

Six locales are tracked under [`apps/reference/messages/`](./apps/reference/messages):

| Locale       | Status         | Notes                                                |
| ------------ | -------------- | ---------------------------------------------------- |
| `en`         | live (baseline)| Source of truth for keys                             |
| `vi`         | live           | Fully translated for Linh's flow                     |
| `ar`         | **stub**       | English fallback values; RTL via `app/[locale]/layout.tsx` |
| `es`         | **stub**       | English fallback values                              |
| `yo`         | **stub**       | English fallback values                              |
| `ht-kreyol`  | **stub**       | English fallback values                              |

See [`apps/reference/messages/README.md`](./apps/reference/messages/README.md) for runtime layout.

### Stub vs live

- **Stub** locales hold English-fallback values so the app renders with no missing-key errors while translators iterate. Stubs still carry every key in the baseline.
- **Live** locales replace the English values with culturally accurate phrasing for every key.
- Upgrading a stub to live: fork, edit values in that locale's JSON only (do not change keys), open a PR titled `i18n(<locale>): live translation`.

## Bundle structure

- `apps/reference/messages/en.json` (source of truth)
- `apps/reference/messages/vi.json`
- `apps/reference/messages/ar.json`
- `apps/reference/messages/es.json`
- `apps/reference/messages/yo.json`
- `apps/reference/messages/ht-kreyol.json`

### Key naming conventions

- Mirror the English baseline key set exactly.
- Keep nesting and naming identical to `en.json`.
- Never remove or rename keys in a translation PR; key changes must originate in `en.json` first.

### ICU MessageFormat compatibility

The app uses [next-intl](https://next-intl.dev/), which speaks ICU MessageFormat. When translating values:

- Preserve placeholders like `{count}`, `{name}`, and `{date}` exactly as written in `en.json`.
- Preserve plural / select branches: `{count, plural, one {…} other {…}}` and `{gender, select, female {…} male {…} other {…}}`.
- Parity is checked at the **key** level, not the ICU branch level, so you may add or remove plural categories per locale (e.g. Arabic's `zero` / `two` / `few` / `many`) as long as the key path is identical.
- Escape literal braces with single quotes (`'{'`) per ICU rules.

## Local parity check

Run the parity check before opening a PR:

```sh
pnpm i18n:check
```

This invokes `scripts/check-i18n-parity.ts` against `apps/reference/messages/*.json`. The same check runs in CI via `.github/workflows/i18n-parity.yml` on every PR touching the messages or the script itself.

### Parity check error format

When a locale drifts, the script exits with status `1` and prints structured lines:

```
check-i18n-parity: parity check failed
  - [ar] missing keys: nav.switchLocale, errors.GroupFull
  - [ht-kreyol] extra keys: app.legacy
```

Each issue line follows `[<locale>] missing keys: <comma-separated list>` or `[<locale>] extra keys: <comma-separated list>`. Nested keys are dotted (`errors.GroupFull`); array entries are bracketed (`tags[0]`).

### Recovery workflow

When CI flags a parity failure on your PR:

1. Run `pnpm i18n:check` locally to reproduce the same `[locale] missing|extra keys: …` output.
2. **Missing keys**: copy the corresponding entry from `apps/reference/messages/en.json` into the failing locale file at the same path. For stub locales, keep the English value verbatim. For live locales, translate the value before committing.
3. **Extra keys**: remove the orphaned key from the failing locale file (it does not exist in `en.json`). If the key should exist globally, add it to `en.json` first in a separate commit so the baseline carries it.
4. Re-run `pnpm i18n:check` until it prints `check-i18n-parity: OK`.
5. Push; CI re-runs the workflow automatically on push.

If you intentionally add a new key to `en.json`, you must add the same key to every other locale file in the same PR — stubs get the English fallback, live locales get a translation.

## Auto-translation prohibition

Machine-generated translation output is not accepted for committed locale files.

- Do not submit content produced by Google Translate, DeepL, or LLM auto-translation.
- Human translators with lived language context are required.
- Reviewers may request a rewrite when phrasing appears machine-generated or culturally off.

## Style guide and term mapping

- English anchor term: `savings circle`.
- Locale communities choose culturally accurate equivalents.
- Known examples include `tanda` (Spanish), `hụi` (Vietnamese), `ajo` (Yoruba), and `sangken` (Haitian Creole).
- Preserve trust, mutual aid, and non-custodial meaning in every locale.

## Maintainer review checklist

Before merging a translation PR, maintainers verify:

- [ ] `pnpm i18n:check` passes (CI green on `i18n parity` workflow).
- [ ] No keys added or removed (use `git diff --stat apps/reference/messages/`).
- [ ] ICU placeholders preserved verbatim.
- [ ] Phrasing reads naturally to a native speaker; no machine-translation artifacts.
- [ ] Cultural anchor term used appropriately for the locale community.
- [ ] Author credited in `CODEOWNERS` for that locale path on first accepted PR.

## Credit and attribution

Translators are credited via:

- A line in the PR body listing the contributor and locale.
- After one accepted translation PR with accurate cultural phrasing and full key parity, contributors can be added as `CODEOWNERS` for their locale path.
- Public attribution in release notes when a stub graduates to live.

## Translation PR template

Use the translation intake template at [`.github/ISSUE_TEMPLATE/translation_pr.md`](./.github/ISSUE_TEMPLATE/translation_pr.md) and include the same checklist in your PR description.
