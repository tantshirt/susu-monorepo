"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocaleDropdown } from "@/components/nav/LocaleDropdown";
import { WalletStatus } from "@/components/nav/WalletStatus";
import { SkinToggle } from "@/components/SkinToggle";
import type { Locale } from "@/lib/i18n/config";

/**
 * Story 7.17 — Mobile-first responsive `<TopNav />` collapse.
 *
 * On viewports below `md` (Tailwind 768px) the four right-aligned controls
 * collapse into a hamburger `<DropdownMenu />`. Per UX-DR16 the
 * `<ClusterPill />` stays *always* visible — it lives in `<TopNav />` outside
 * this client component. Only `<LocaleDropdown />`, `<SkinToggle />`, and
 * `<WalletStatus />` collapse here.
 *
 * The hamburger button hits the WCAG 2.5.5 touch-target floor: it's 44 × 44
 * (`size-11`) and uses logical Tailwind classes only.
 *
 * Rendered alongside the existing `hidden md:flex` desktop control row in
 * `<TopNav />`. The desktop row hides at `< md`; this hamburger is `md:hidden`
 * so the two never both render.
 */
export interface MobileNavMenuProps {
  locale: Locale;
}

export function MobileNavMenu({ locale }: MobileNavMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label="Open navigation menu"
        className={[
          // 44px floor (WCAG 2.5.5 / UX-DR29).
          "inline-flex h-11 w-11 items-center justify-center rounded-md",
          "border border-border bg-surface2 text-text",
          "hover:bg-surface hover:border-primary/40",
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
        className="flex w-56 flex-col gap-2 p-3"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption text-muted">Locale</span>
          <LocaleDropdown currentLocale={locale} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption text-muted">Skin</span>
          <SkinToggle />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption text-muted">Wallet</span>
          <WalletStatus />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default MobileNavMenu;
