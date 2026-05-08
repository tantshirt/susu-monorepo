import {LocaleDropdown} from '../../components/locale-dropdown';
import {getTranslations} from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('home');

  return (
    <main>
      <LocaleDropdown />
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
      <button type="button">{t('primaryCta')}</button>
      <button type="button">{t('secondaryCta')}</button>
    </main>
  );
}
