import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isSupportedLocale, isRtl, locales } from "@/lib/i18n/config";

/**
 * Locale segment layout for Story 7.7. Sets `lang` and `dir` on a wrapping
 * region so screen readers and CSS bidi flips track the active locale (`ar`
 * is the only RTL locale today). The root `<html>` lives in
 * `app/layout.tsx` per the locked provider chain from Story 7.1.
 *
 * `setRequestLocale` lets static rendering work for each prefix.
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);

  // ar (and future RTL locales) flip direction; everything else is LTR.
  return (
    <div lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className="contents">
      {children}
    </div>
  );
}
