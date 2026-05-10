import type { Metadata, Viewport } from "next";
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
import { getServerSkin } from "@/lib/theme/skin";

/**
 * Story 7.5 — pre-hydration skin reconciliation script.
 *
 * The cookie is the SSR-readable source of truth, so `<html data-skin>` is
 * already correct on first paint. This script handles the cross-tab case:
 * if `localStorage["susu-skin"]` was updated in another tab while this tab
 * was inactive, reconcile `data-skin` synchronously BEFORE React hydrates so
 * users never see a paint at the stale skin. We do not flip `data-skin` in
 * a `useEffect` (that flashes after paint).
 */
const skinHydrationScript = `(() => {
  try {
    var stored = window.localStorage.getItem('susu-skin');
    if (stored === 'neutral' || stored === 'diaspora') {
      var current = document.documentElement.dataset.skin;
      if (current !== stored) {
        document.documentElement.dataset.skin = stored;
      }
    }
  } catch (_) {}
})();`;

export const metadata: Metadata = {
  title: "Susu — rotating savings circles",
  description:
    "Susu helps savings circles show the schedule, preview each transaction, and keep receipts members can check.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
 * subtree) inherits the unified Inter-led typography stack. No runtime Google Fonts
 * request is made — assets ship from `public/fonts/`.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const skin = await getServerSkin();

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
      data-skin={skin}
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Story 7.5: pre-hydration skin reconcile — must run before React. */}
        <script dangerouslySetInnerHTML={{ __html: skinHydrationScript }} />
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
