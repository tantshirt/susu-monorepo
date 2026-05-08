'use client';

import {usePathname, useRouter} from 'next/navigation';
import {useLocale} from 'next-intl';

import {locales} from '../lib/i18n/config';
import {useTranslation} from '../lib/i18n/useTranslation';

export function LocaleDropdown() {
  const t = useTranslation('localeSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onLocaleChange(nextLocale: string) {
    const segments = pathname.split('/').filter(Boolean);
    const hasLocalePrefix = locales.includes(segments[0] as (typeof locales)[number]);
    const rest = hasLocalePrefix ? segments.slice(1) : segments;
    let currentPathWithoutLocale = pathname;
    if (hasLocalePrefix) {
      currentPathWithoutLocale = rest.length > 0 ? `/${rest.join('/')}` : '';
    }
    router.replace(`/${nextLocale}${currentPathWithoutLocale}`);
  }

  return (
    <label>
      <span>{t('label')}</span>
      <select aria-label={t('label')} onChange={(event) => onLocaleChange(event.target.value)} value={locale}>
        {locales.map((item) => (
          <option key={item} value={item}>
            {t(`options.${item}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
