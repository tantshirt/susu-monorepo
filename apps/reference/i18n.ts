import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { isSupportedLocale } from "@/lib/i18n/config";

/**
 * Server-side message loader for next-intl. Looks up a JSON message bundle by
 * locale; unknown locales 404 so users hit a clean error rather than silent
 * fallback.
 */
export default getRequestConfig(async ({ locale }) => {
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = (await import(`./messages/${locale}.json`)).default;
  return {
    locale,
    messages,
    timeZone: "UTC",
  };
});
