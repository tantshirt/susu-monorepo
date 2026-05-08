import {LocaleDropdown} from '../../components/locale-dropdown';
import {useTranslation} from '../../lib/i18n/useTranslation';

export default function HomePage() {
  const t = useTranslation('home');

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
