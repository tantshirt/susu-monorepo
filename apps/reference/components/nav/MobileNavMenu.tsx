"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocaleDropdown } from "@/components/nav/LocaleDropdown";
import { SkinToggle } from "@/components/SkinToggle";
import type { Locale } from "@/lib/i18n/config";
import type { Skin } from "@/lib/theme/skin-shared";

/**
 * Story 7.17 — Mobile-first responsive `<TopNav />` collapse.
 *
 * On viewports below `md` (Tailwind 768px) compact links collapse into a
 * hamburger `<DropdownMenu />`. Per UX-DR16 the `<ClusterPill />` stays
 * *always* visible — it lives in `<TopNav />` outside this component.
 * `<WalletStatus />` also stays outside so Connect is one tap away.
 *
 * The hamburger button hits the WCAG 2.5.5 touch-target floor: it's 44 × 44
 * (`size-11`) and uses logical Tailwind classes only.
 */
export interface MobileNavMenuProps {
  locale: Locale;
  initialSkin: Skin;
  demoHref: string;
  howItWorksHref: string;
}

export function MobileNavMenu({
  locale,
  initialSkin,
  demoHref,
  howItWorksHref,
}: MobileNavMenuProps) {
  const t = useTranslations("nav");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label="Open navigation menu"
        className={[
          // 44px floor (WCAG 2.5.5 / UX-DR29).
          "inline-flex h-11 w-11 items-center justify-center rounded-pill",
          "border border-border bg-surface text-text shadow-1",
          "hover:border-primary/40 hover:bg-surface2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        ].join(" ")}
        data-testid="topnav-hamburger"
      >
        {/* Hamburger glyph as inline SVG so we don't pull lucide-react. */}
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
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="flex w-64 flex-col gap-3 p-3"
      >
        <div className="flex flex-col gap-1 border-b border-border pb-3">
          <Link
            href={howItWorksHref}
            className="rounded-lg px-3 py-2 text-sm font-medium text-text hover:bg-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
          >
            {t("howItWorks")}
          </Link>
          <Link
            href={demoHref}
            className="rounded-lg px-3 py-2 text-sm font-medium text-text hover:bg-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
          >
            {t("demo")}
          </Link>
        </div>
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

export default MobileNavMenu;
