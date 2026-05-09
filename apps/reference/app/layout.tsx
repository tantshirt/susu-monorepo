import type { Metadata } from "next";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { PrivyProviderWrapper } from "./providers/PrivyProviderWrapper";
import { ConvexProviderWrapper } from "./providers/ConvexProviderWrapper";
import { IntlProviderWrapper } from "./providers/IntlProviderWrapper";
import { isRtl } from "@/lib/i18n/config";
import {
  geistDisplay,
  inter,
  geistMono,
  notoSans,
  notoArabic,
} from "@/lib/theme/fonts";

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
 *
 * Story 7.3 wires the self-hosted typography variables onto `<html>` so
 * the entire tree (including portals + popovers rendered outside the body
 * subtree) inherits the design typography stack. No runtime Google Fonts
 * request is made — assets ship from `public/fonts/`.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  const fontVariables = [
    geistDisplay.variable,
    inter.variable,
    geistMono.variable,
    notoSans.variable,
    notoArabic.variable,
  ].join(" ");

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      data-skin="neutral"
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
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
