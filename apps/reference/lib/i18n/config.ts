/**
 * i18n configuration for Story 7.7 (FR43).
 *
 * Six locales total: `en` and `vi` are live; `ar`, `es`, `yo`, `ht-kreyol` ship
 * as stub files with English fallback values per UX-DR47 so community
 * translators can populate them without code changes.
 *
 * `next-intl` middleware (see `apps/reference/middleware.ts`) enforces
 * cookie-based locale persistence: the dropdown writes a cookie via
 * `next-intl/navigation`, and the middleware honors it on subsequent requests.
 */

export const locales = [
  "en",
  "vi",
  "ar",
  "es",
  "yo",
  "ht-kreyol",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale = "en" satisfies Locale;

/** Locales that render right-to-left. Currently only Arabic. */
export const rtlLocales: readonly Locale[] = ["ar"];

/**
 * Cookie name used by `next-intl` middleware to persist the user's locale
 * preference across sessions. Exposed here so the locale dropdown (Story 7.6)
 * and middleware reference the same identifier.
 */
export const localeCookieName = "NEXT_LOCALE";

export function isRtl(locale: string): boolean {
  return (rtlLocales as readonly string[]).includes(locale);
}

export function isSupportedLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
