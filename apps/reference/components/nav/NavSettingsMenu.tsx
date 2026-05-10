"use client";

import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LocaleDropdown } from "@/components/nav/LocaleDropdown";
import { SkinToggle } from "@/components/SkinToggle";
import type { Locale } from "@/lib/i18n/config";
import type { Skin } from "@/lib/theme/skin-shared";

export interface NavSettingsMenuProps {
  locale: Locale;
  initialSkin: Skin;
}

/**
 * Desktop-only compact menu for locale + skin (Story 7.x premium nav).
 * Keeps the top bar minimal while preserving UX-DR47 / skin persistence.
 */
export function NavSettingsMenu({ locale, initialSkin }: NavSettingsMenuProps) {
  const t = useTranslations("nav");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("moreMenu")}
          className="text-muted hover:text-text"
          data-testid="topnav-settings-trigger"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-5"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="flex w-64 flex-col gap-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted">{t("switchLocale")}</span>
          <LocaleDropdown currentLocale={locale} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted">{t("switchSkin")}</span>
          <SkinToggle initialSkin={initialSkin} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
