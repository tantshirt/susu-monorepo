# ATDD — Story 7.7: next-intl multi-locale routing (en + vi live, 4 stubs, FR43)

GitHub issue: #71
Branch: `story-7-7-i18n-routing`

## Acceptance criteria → tests

| AC | Test |
| --- | --- |
| `apps/reference/messages/en.json` is the English baseline | static.red asserts file exists, parses to JSON, has top-level keys |
| `apps/reference/messages/vi.json` carries Vietnamese translation | static.red asserts file exists, parses to JSON, has matching key set vs. en, contains at least one non-en string value |
| `apps/reference/messages/{ar,es,yo,ht-kreyol}.json` are committed stubs | static.red asserts each file exists, parses, contains the same key set as en (English fallback values acceptable per UX-DR47) |
| `apps/reference/lib/i18n/config.ts` configures next-intl with cookie persistence and `defaultLocale = "en"` | static.red asserts file exists, exports `locales`, exports `defaultLocale = "en"`, references cookie persistence |
| `apps/reference/middleware.ts` enforces locale prefix routing | static.red asserts file exists, imports `next-intl/middleware`, references the locale list and `defaultLocale` |
| Locale-prefixed segments live under `app/[locale]/` | static.red asserts `app/[locale]/layout.tsx` and `app/[locale]/page.tsx` exist and `app/[locale]/layout.tsx` sets `lang={locale}` and `dir` for RTL |
| `IntlProviderWrapper` actually loads locale messages | static.red asserts the wrapper imports messages dynamically by locale (no hardcoded `en` map) |
| String-literal lint guard for UX-DR46 | static.red asserts ATDD spec exists (this file) — lint rules land via Story 7.8 |

## Out of scope (covered by other stories)

- Locale dropdown UX (Story 7.6)
- Translator workflow + CI parity check (Story 7.8)
- Playwright runtime locale switching (Story 7.8/7.10 e2e)
