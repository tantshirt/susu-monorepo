import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { PrivyProviderWrapper } from "./providers/PrivyProviderWrapper";
import { ConvexProviderWrapper } from "./providers/ConvexProviderWrapper";
import { IntlProviderWrapper } from "./providers/IntlProviderWrapper";
import { isRtl } from "@/lib/i18n/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Susu Reference App",
  description: "Reference UX surface for the Susu Protocol monorepo.",
};

/**
 * Locked provider order: PrivyProvider > ConvexProvider > IntlProvider > children.
 *
 * Privy is outermost so that Convex queries can read the authenticated identity
 * during hydration. Story 7.7 wires per-locale message loading via
 * `next-intl/server`; the locale segment under `app/[locale]/layout.tsx`
 * sets per-request `lang`/`dir` on a wrapping region. The root `<html>`
 * element is owned here (Next.js App Router rule), and we set its `lang`
 * and `dir` from the active locale.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      data-skin="neutral"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PrivyProviderWrapper>
          <ConvexProviderWrapper>
            <IntlProviderWrapper locale={locale} messages={messages}>
              {children}
            </IntlProviderWrapper>
          </ConvexProviderWrapper>
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}
