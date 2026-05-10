"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { WalletStatus } from "@/components/nav/WalletStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet/useWallet";

function HeroEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="w-fit rounded-pill border border-border bg-surface2 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
      {children}
    </span>
  );
}

function shortPubkey(address: string, head = 4, tail = 4): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

const heroImageUrl = "https://framerusercontent.com/images/BBQSOOzFQf6aBaNHTXKI0yU.png";

export interface MemberDashboardProps {
  locale: string;
}

/**
 * Production dashboard — wallet-first operations surface.
 */
export function MemberDashboard({ locale }: MemberDashboardProps) {
  const t = useTranslations("dashboard");
  const wallet = useWallet();
  const actionRows = [
    {
      title: wallet.connected ? t("queueCreateTitle") : t("queueConnectTitle"),
      body: wallet.connected ? t("queueCreateBody") : t("queueConnectBody"),
      status: wallet.connected ? t("statusReady") : t("statusRequired"),
    },
    {
      title: t("queueJoinTitle"),
      body: t("queueJoinBody"),
      status: t("statusAccessCode"),
    },
    {
      title: t("queueLearnTitle"),
      body: t("queueLearnBody"),
      status: t("statusOptional"),
    },
  ];

  if (!wallet.connected) {
    return (
      <main className="relative -mt-24 flex min-h-screen w-full items-center justify-center overflow-hidden bg-text px-5 pt-24">
        <div
          aria-hidden
          className="absolute inset-0 scale-[1.02] bg-cover bg-[position:center_42%]"
          style={{ backgroundImage: `url(${heroImageUrl})` }}
        />
        <div aria-hidden className="absolute inset-0 bg-text/38" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,transparent_0%,rgba(0,0,0,0.12)_36%,rgba(0,0,0,0.58)_100%)]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-text/70 to-transparent" />
        <section className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-6 text-center text-white">
          <div className="absolute start-0 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 text-white/60 lg:flex">
            <span className="h-16 w-px bg-white/40" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.32em] [writing-mode:vertical-rl]">
              {t("landingEyebrow")}
            </span>
            <span className="h-16 w-px bg-white/40" />
          </div>
          <p
            data-testid="landing-susu-logo"
            className="font-display text-[clamp(6rem,22vw,17rem)] font-semibold leading-none tracking-[-0.11em] drop-shadow-[0_22px_54px_rgba(0,0,0,0.46)]"
          >
            SUSU
          </p>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-white/78 lg:hidden">
            {t("landingEyebrow")}
          </p>
          <h1 className="max-w-3xl text-h1 font-semibold tracking-[-0.04em] text-white drop-shadow-[0_10px_24px_rgba(0,0,0,0.34)] md:text-display-2">
            {t("landingPhrase")}
          </h1>
          <p className="max-w-xl text-body leading-7 text-white/82 drop-shadow-[0_8px_18px_rgba(0,0,0,0.32)]">
            {t("landingBody")}
          </p>
          <div className="mt-2 flex flex-col gap-2 rounded-[2rem] border border-white/30 bg-white/10 p-2 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-md sm:flex-row">
            <WalletStatus
              disconnectedLabel="Connect wallet"
              disconnectedVariant="secondary"
              className="min-w-40 border-white/90 bg-white px-6 !text-black shadow-[0_12px_34px_rgba(0,0,0,0.24)] [text-shadow:0_1px_0_rgba(255,255,255,0.35)] hover:border-white hover:bg-white/92"
            />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="border border-white/20 bg-transparent px-5 text-white hover:bg-white/12 hover:text-white"
            >
              <Link href={`/${locale}/how-it-works`}>{t("howItWorksCta")}</Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <section className="flex flex-col gap-6 border-b border-border/70 pb-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="flex max-w-3xl flex-col gap-4">
            <HeroEyebrow>{t("heroBadge")}</HeroEyebrow>
            <div className="flex flex-col gap-3">
              <h1 className="text-display-2 font-semibold tracking-tight text-text md:text-display-1">
                {t("heroTitle")}
              </h1>
              <p className="max-w-2xl text-body leading-7 text-muted">{t("heroSubtitle")}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end" aria-label="Primary actions">
            <Button asChild variant="primary" size="md">
              <Link href={`/${locale}/groups/new`}>{t("createCircleCta")}</Link>
            </Button>
            <Button asChild variant="secondary" size="md">
              <Link href={`/${locale}/join`}>{t("joinCircleCta")}</Link>
            </Button>
            <Button asChild variant="outline" size="md">
              <Link href={`/${locale}/how-it-works`}>{t("howItWorksCta")}</Link>
            </Button>
          </div>
        </div>

        <div className="grid border border-border/70 bg-surface shadow-1 md:grid-cols-4">
          <div className="border-b border-border/70 p-4 md:border-b-0 md:border-e">
            <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted">
              {t("walletStatusLabel")}
            </p>
            <p className="mt-2 font-mono text-body font-semibold text-text">
              {wallet.connected && wallet.address ? shortPubkey(wallet.address) : t("walletDisconnected")}
            </p>
          </div>
          <div className="border-b border-border/70 p-4 md:border-b-0 md:border-e">
            <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted">
              {t("networkLabel")}
            </p>
            <p className="mt-2 font-mono text-body font-semibold text-text">{wallet.cluster}</p>
          </div>
          <div className="border-b border-border/70 p-4 md:border-b-0 md:border-e">
            <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted">
              {t("groupsLabel")}
            </p>
            <p className="mt-2 font-mono text-body font-semibold text-text">{t("groupsEmptyValue")}</p>
          </div>
          <div className="p-4">
            <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted">
              {t("nextActionLabel")}
            </p>
            <p className="mt-2 text-body font-semibold text-text">
              {wallet.connected ? t("nextActionCreate") : t("nextActionConnect")}
            </p>
          </div>
        </div>
      </section>

      {!wallet.connected ? (
        <section className="grid gap-4 border border-primary/20 bg-primary/10 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <h2 className="text-h3 font-semibold tracking-tight text-text">{t("connectPanelTitle")}</h2>
            <p className="mt-2 max-w-2xl text-body leading-7 text-muted">{t("connectPanelBody")}</p>
          </div>
          <div className="justify-self-start md:justify-self-end">
            <WalletStatus />
          </div>
        </section>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-h2 font-semibold tracking-tight text-text">{t("actionQueueTitle")}</h2>
              <Badge variant={wallet.connected ? "signal" : "warn"}>
                {wallet.connected ? t("statusReady") : t("statusRequired")}
              </Badge>
            </div>
            <div className="divide-y divide-border/70 border-y border-border/70">
              {actionRows.map((item) => (
                <div key={item.title} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_8rem] md:items-center">
                  <div>
                    <h3 className="text-body font-semibold text-text">{item.title}</h3>
                    <p className="mt-1 text-body leading-7 text-muted">{item.body}</p>
                  </div>
                  <span className="font-mono text-caption font-semibold uppercase tracking-[0.14em] text-muted md:text-end">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-h2 font-semibold tracking-tight text-text">{t("groupsWorkspaceTitle")}</h2>
                <p className="mt-2 text-body text-muted">{t("groupsWorkspaceBody")}</p>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/${locale}/groups`}>{t("viewGroups")}</Link>
              </Button>
            </div>

            <div className="overflow-x-auto border border-border/70 bg-surface">
              <table className="w-full min-w-[760px] border-collapse text-start">
                <thead className="border-b border-border/70 bg-surface2/70">
                  <tr className="text-caption font-semibold uppercase tracking-[0.16em] text-muted">
                    <th className="px-4 py-3 text-start">{t("tableGroup")}</th>
                    <th className="px-4 py-3 text-start">{t("tableRole")}</th>
                    <th className="px-4 py-3 text-start">{t("tableStatus")}</th>
                    <th className="px-4 py-3 text-start">{t("tableNextAction")}</th>
                    <th className="px-4 py-3 text-end">{t("tableAccess")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <p className="text-body font-semibold text-text">{t("emptyStateTitle")}</p>
                      <p className="mx-auto mt-2 max-w-xl text-body leading-7 text-muted">
                        {t("emptyStateBody")}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-6 xl:sticky xl:top-24">
          <section className="border border-border/70 bg-surface p-5 shadow-1">
            <h2 className="text-h3 font-semibold tracking-tight text-text">{t("accessCodeTitle")}</h2>
            <p className="mt-2 text-body leading-7 text-muted">{t("accessCodeBody")}</p>
            <Button asChild variant="primary" size="md" className="mt-5 w-full">
              <Link href={`/${locale}/join`}>{t("joinCircleCta")}</Link>
            </Button>
          </section>

          <section className="border border-border/70 bg-surface p-5 shadow-1">
            <h2 className="text-h3 font-semibold tracking-tight text-text">{t("activityTitle")}</h2>
            <ol className="mt-4 flex flex-col gap-4">
              {[t("activityConnect"), t("activityCreate"), t("activityShare")].map((item, index) => (
                <li key={item} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full border border-border bg-surface2 font-mono text-caption font-semibold text-muted">
                    {index + 1}
                  </span>
                  <span className="text-body leading-7 text-muted">{item}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
