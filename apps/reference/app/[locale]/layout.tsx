import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isSupportedLocale, isRtl, locales, type Locale } from "@/lib/i18n/config";
import { TopNav } from "@/components/TopNav";

/**
 * Locale segment layout for Stories 7.6 + 7.7.
 *
 * Sets `lang` and `dir` on a wrapping region so screen readers and CSS bidi
 * flips track the active locale (`ar` is the only RTL locale today). The root
 * `<html>` lives in `app/layout.tsx` per the locked provider chain from
 * Story 7.1.
 *
 * Story 7.6 mounts `<TopNav locale={locale} />` here so every locale-prefixed
 * route renders the always-visible cluster pill and locale/skin/wallet
 * controls (UX-DR16, FR47, NFR-S8).
 *
 * Next.js 16 typing: `params` is a `Promise` and must be awaited before
 * destructuring — the older sync form trips a type error on `pnpm build`.
 *
 * `setRequestLocale` lets static rendering work for each prefix.
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);

  // ar (and future RTL locales) flip direction; everything else is LTR.
  return (
    <div lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className="contents">
      <TopNav locale={locale as Locale} />
      {children}
    </div>
  );
}
