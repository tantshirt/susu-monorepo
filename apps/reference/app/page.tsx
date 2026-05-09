import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config";

/**
 * Story 7.7 routes everything through `app/[locale]/...`. The middleware
 * prefixes incoming requests, but this server component is the safety net
 * for any direct hit on `/`: it redirects to the default locale prefix.
 */
export default function RootRedirect(): never {
  redirect(`/${defaultLocale}`);
}
