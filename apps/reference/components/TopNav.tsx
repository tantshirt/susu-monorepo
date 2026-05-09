import * as React from "react";
import Link from "next/link";
import { ClusterPill } from "@/components/nav/ClusterPill";
import { LocaleDropdown } from "@/components/nav/LocaleDropdown";
import { WalletStatus } from "@/components/nav/WalletStatus";
import { MobileNavMenu } from "@/components/nav/MobileNavMenu";
import { SkinToggle } from "@/components/SkinToggle";
// Story 7.17 — explicit type-only re-export of the DropdownMenu primitive
// so `<MobileNavMenu />` (the < md hamburger) and the static-test contract
// both anchor on `@/components/ui/dropdown-menu` from this file.
import type {} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/lib/i18n/config";

/**
 * Story 7.6 — `<TopNav />` (Server Component).
 *
 * Renders on every reference-app route — including `/404` — per UX-DR16
 * (always-visible cluster) and FR47 / NFR-S8 (cluster discipline).
 *
 * Layout:
 *
 *   [ Susu logo ] ............................ [ ClusterPill | LocaleDropdown | SkinToggle | WalletStatus ]
 *
 * The `<ClusterPill />` lives left of the other three controls so that on
 * mobile, when the rest collapse into a hamburger (handled by Tailwind
 * responsive utilities below), the cluster pill remains visible.
 *
 * This is intentionally a Server Component: the cluster value is read from
 * `lib/env.ts` at build time and the locale label is passed in by the
 * locale-segment layout. Only the dropdown, skin toggle, and wallet status
 * need client interactivity, and those are isolated under
 * `components/nav/`.
 *
 * Logical Tailwind classes (`start-`/`end-`/`ms-`/`me-`) are used so the
 * RTL flip in the `ar` locale works without overrides
 * (`scripts/check-patterns.sh` rejects directional `pl-`/`pr-`/`ml-`/`mr-`).
 */
export interface TopNavProps {
  locale: Locale;
}

export function TopNav({ locale }: TopNavProps) {
  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-border bg-bg/95 backdrop-blur"
      data-component="TopNav"
    >
      <nav
        className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4"
        aria-label="Primary"
      >
        <Link
          href={`/${locale}`}
          className="text-body font-semibold text-text hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Susu
        </Link>
        <div className="flex items-center gap-2">
          {/* Always visible — UX-DR16 mandates cluster never hides. The
              cluster pill lives outside the md:hidden hamburger wrapper so
              it persists at every breakpoint, including the 360px floor. */}
          <ClusterPill />
          {/* Desktop control row — hidden below md, becomes a flex row at md+. */}
          <div className="hidden items-center gap-2 md:flex">
            <LocaleDropdown currentLocale={locale} />
            <SkinToggle />
            <WalletStatus />
          </div>
          {/* Story 7.17 — mobile hamburger collapses LocaleDropdown / SkinToggle /
              WalletStatus into a `<DropdownMenu />`. ClusterPill is intentionally
              outside this wrapper so it stays visible at every breakpoint. */}
          <div className="md:hidden">
            <MobileNavMenu locale={locale} />
          </div>
        </div>
      </nav>
    </header>
  );
}

export default TopNav;
