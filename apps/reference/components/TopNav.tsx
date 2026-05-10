import Link from "next/link";
import { ClusterPill } from "@/components/nav/ClusterPill";
import { WalletStatus } from "@/components/nav/WalletStatus";
import { MobileNavMenu } from "@/components/nav/MobileNavMenu";
import { NavSettingsMenu } from "@/components/nav/NavSettingsMenu";
import { AuthNavLinks, type AuthNavLink } from "@/components/nav/AuthNavLinks";
// Story 7.17 — explicit type-only re-export of the DropdownMenu primitive
// so `<MobileNavMenu />` (the < md hamburger) and the static-test contract
// both anchor on `@/components/ui/dropdown-menu` from this file.
import { getTranslations } from "next-intl/server";
import type {} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/lib/i18n/config";
import { getServerSkin } from "@/lib/theme/skin";
import { cn } from "@/lib/utils";

/**
 * Story 7.6 — `<TopNav />` (Server Component).
 *
 * Renders on every reference-app route — including `/404` — per UX-DR16
 * (always-visible cluster) and FR47 / NFR-S8 (cluster discipline).
 *
 * Layout (premium floating shell):
 *
 *   [ Susu | Dashboard · Groups · Create · Join · How it works ] ... [ ClusterPill | Wallet | (mobile menu) ]
 *
 * Locale and skin: mobile hamburger below `md`, compact settings menu on
 * desktop (`NavSettingsMenu`). Cluster remains outside menus so it is never hidden.
 *
 * Logical Tailwind classes (`start-`/`end-`/`ms-`/`me-`) are used so the
 * RTL flip in the `ar` locale works without overrides
 * (`scripts/check-patterns.sh` rejects directional `pl-`/`pr-`/`ml-`/`mr-`).
 */
export interface TopNavProps {
  locale: Locale;
}

export async function TopNav({ locale }: TopNavProps) {
  const t = await getTranslations("nav");
  const initialSkin = await getServerSkin();
  const navLinks = [
    { href: `/${locale}`, label: t("dashboard"), requiresWallet: true },
    { href: `/${locale}/groups`, label: t("groups"), requiresWallet: true },
    { href: `/${locale}/groups/new`, label: t("createGroup"), requiresWallet: true },
    { href: `/${locale}/join`, label: t("joinGroup"), requiresWallet: true },
    { href: `/${locale}/how-it-works`, label: t("howItWorks") },
  ] satisfies readonly AuthNavLink[];

  const navText =
    "text-sm font-medium text-text/90 transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

  return (
    <header
      className="sticky top-0 z-40 w-full pointer-events-none px-4 pt-3 pb-2 md:px-6 md:pt-4"
      data-component="TopNav"
    >
      <nav
        className="pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-full border border-border/60 bg-surface/90 shadow-1 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/75 md:gap-3 md:px-5 md:py-2.5 px-3 py-2"
        aria-label="Primary"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-6">
          <Link
            href={`/${locale}`}
            className={cn(
              navText,
              "shrink-0 rounded-md px-1 py-1 tracking-tight",
            )}
          >
            Susu
          </Link>
          <AuthNavLinks
            links={navLinks}
            className="hidden min-w-0 shrink-0 items-center gap-0.5 md:flex"
            linkClassName={cn(navText, "rounded-pill px-3 py-2 hover:bg-surface2/90")}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ClusterPill quiet />
          <div
            className="hidden shrink-0 items-center gap-1 md:flex md:gap-2"
            data-nav-desktop-controls
          >
            <NavSettingsMenu locale={locale} initialSkin={initialSkin} />
            <WalletStatus hideWhenDisconnected />
          </div>
          <div
            className="flex shrink-0 items-center gap-2 md:hidden"
            data-nav-mobile-controls
          >
            <WalletStatus hideWhenDisconnected />
            <MobileNavMenu locale={locale} initialSkin={initialSkin} navLinks={navLinks} />
          </div>
        </div>
      </nav>
    </header>
  );
}

export default TopNav;
