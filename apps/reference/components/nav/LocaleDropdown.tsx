"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { locales, localeCookieName, type Locale } from "@/lib/i18n/config";

/**
 * Story 7.6 — `<LocaleDropdown />`.
 *
 * Lists all six supported locales (`en`, `vi`, `ar`, `es`, `yo`, `ht-kreyol`)
 * with their native names per UX-DR47. On select:
 *   1. Writes the next-intl cookie (`NEXT_LOCALE`) so the middleware honors
 *      the choice on subsequent SSR requests.
 *   2. Pushes the same path under the new locale prefix.
 *
 * `en` and `vi` are live; the other four ship as stubs with English fallback
 * values per Story 7.7 — translators populate them without code changes.
 */

const LABELS: Record<Locale, string> = {
  "en": "English",
  "vi": "Tiếng Việt",
  "ar": "العربية",
  "es": "Español",
  "yo": "Yorùbá",
  "ht-kreyol": "Kreyòl Ayisyen",
};

const ONE_YEAR_SECONDS = 31536000;

function pathWithoutLocale(pathname: string): string {
  // Strip the leading `/<locale>` segment if present; otherwise return as-is.
  const segments = pathname.split("/");
  if (segments.length >= 2 && (locales as readonly string[]).includes(segments[1])) {
    const stripped = "/" + segments.slice(2).join("/");
    return stripped === "/" ? "/" : stripped.replace(/\/$/, "");
  }
  return pathname || "/";
}

export interface LocaleDropdownProps {
  currentLocale: Locale;
}

export function LocaleDropdown({ currentLocale }: LocaleDropdownProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  const onSelect = React.useCallback(
    (next: Locale) => {
      // Cookie persistence — middleware reads this on the next SSR pass.
      try {
        document.cookie =
          `${localeCookieName}=${next}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
      } catch {
        // Cookies disabled: navigation still works because the URL prefix wins.
      }
      const rest = pathWithoutLocale(pathname);
      const target = rest === "/" ? `/${next}` : `/${next}${rest}`;
      router.push(target);
    },
    [pathname, router],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Switch language"
          data-current-locale={currentLocale}
        >
          {LABELS[currentLocale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        {locales.map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => onSelect(code)}
            data-locale={code}
            aria-current={code === currentLocale ? "true" : undefined}
          >
            {LABELS[code]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LocaleDropdown;
