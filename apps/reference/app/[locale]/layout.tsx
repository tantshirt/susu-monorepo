import {NextIntlClientProvider} from 'next-intl';

import {localeDirection} from '../../lib/i18n/config';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <html dir={localeDirection(locale)} lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
