import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale, localeCookieName } from "@/lib/i18n/config";

/**
 * next-intl middleware enforces locale-prefixed routing under
 * `app/[locale]/...` and persists the user's choice in a cookie so the
 * locale dropdown (Story 7.6) sticks across sessions. See FR43 / UX-DR47.
 */
export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
  localeCookie: { name: localeCookieName },
});

export const config = {
  // Skip Next.js internals and static assets; rewrite everything else.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
