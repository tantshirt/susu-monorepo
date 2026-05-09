# Susu reference app — locale messages

Six locales total per Story 7.7 / FR43 / UX-DR47:

| Locale | Status | Notes |
| --- | --- | --- |
| `en` | live (baseline) | Source of truth for keys |
| `vi` | live | Fully translated for Linh's flow |
| `ar` | **stub** | English fallback values; RTL handled by `app/[locale]/layout.tsx` |
| `es` | **stub** | English fallback values |
| `yo` | **stub** | English fallback values |
| `ht-kreyol` | **stub** | English fallback values |

Stub files exist so translators can populate values without touching code.
Story 7.8 lands the locale-key parity CI check that prevents drift.
