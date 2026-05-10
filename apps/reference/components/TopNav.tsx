import Link from "next/link";
import { ClusterPill } from "@/components/nav/ClusterPill";
import { WalletStatus } from "@/components/nav/WalletStatus";
import { MobileNavMenu } from "@/components/nav/MobileNavMenu";
import { NavSettingsMenu } from "@/components/nav/NavSettingsMenu";
import { AuthNavLinks, type AuthNavLink } from "@/components/nav/AuthNavLinks";
import { TopNavChrome } from "@/components/nav/TopNavChrome";
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
 * Layout (premium floating shell via `<TopNavChrome />` — glass at top, more
 * opaque after scroll; respects prefers-reduced-motion):
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

  const brandWordmark =
    "font-display text-sm font-medium tracking-tight text-text/95 transition-colors duration-200 motion-reduce:transition-none hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

  const navLinkBase =
    "text-sm font-medium text-text/70 transition-colors duration-200 motion-reduce:transition-none hover:text-text focus-visible:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-surface underline-offset-[5px] decoration-from-font hover:underline hover:decoration-text/35 focus-visible:underline focus-visible:decoration-text/60";

  return (
    <header
      className="sticky top-0 z-40 w-full pointer-events-none px-4 pt-3 pb-2 md:px-6 md:pt-4"
      data-component="TopNav"
    >
      <TopNavChrome aria-label="Primary">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-7">
          <Link
            href={`/${locale}`}
            className={cn(brandWordmark, "shrink-0 rounded-md px-1 py-1")}
          >
            Susu
          </Link>
          <AuthNavLinks
            links={navLinks}
            className="hidden min-w-0 shrink-0 items-center gap-1 md:flex"
            linkClassName={cn(
              navLinkBase,
              "rounded-pill px-3 py-2 hover:bg-surface2/50",
            )}
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
      </TopNavChrome>
    </header>
  );
}

export default TopNav;
