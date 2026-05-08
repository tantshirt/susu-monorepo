import {defineRouting} from 'next-intl/routing';

export const locales = ['en', 'vi', 'ar', 'es', 'yo', 'ht-kreyol'] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'en';

export const rtlLocales = ['ar'] as const;

export const localeCookie = {
  name: 'NEXT_LOCALE',
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax' as const,
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeCookie,
});

export function localeDirection(locale: string): 'ltr' | 'rtl' {
  return (rtlLocales as readonly string[]).includes(locale) ? 'rtl' : 'ltr';
}
