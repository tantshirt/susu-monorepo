import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { isSupportedLocale } from "@/lib/i18n/config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  if (typeof requested !== "string" || !isSupportedLocale(requested)) {
    notFound();
  }

  const locale = requested;
  const messages = (await import(`./messages/${locale}.json`)).default;
  return {
    locale,
    messages,
    timeZone: "UTC",
  };
});
