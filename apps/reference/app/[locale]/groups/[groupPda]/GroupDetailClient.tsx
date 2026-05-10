"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/susu/Banner";
import { WalletStatus } from "@/components/nav/WalletStatus";
import { WalletGate } from "@/components/auth/WalletGate";
import { useGroupMetadata } from "@/lib/convex/use-group-metadata";
import { useWallet } from "@/lib/wallet/useWallet";

export interface GroupDetailClientProps {
  groupPda: string;
  locale: string;
}

function shortPubkey(address: string, head = 6, tail = 6): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/**
 * Group workspace with production actions. On-chain state indexing lands after the
 * Epic 9 foundation, so the route shows explicit setup status instead.
 */
export function GroupDetailClient({ groupPda, locale }: GroupDetailClientProps) {
  const t = useTranslations("groupDetail");
  const wallet = useWallet();
  const metadata = useGroupMetadata(groupPda);
  const name = metadata?.name ?? t("fallbackName");

  return (
    <WalletGate locale={locale}>
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
      <header className="flex flex-col justify-between gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end">
        <div className="flex max-w-3xl flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="w-fit text-muted hover:text-text">
              <Link href={`/${locale}/groups`}>← {t("backLink")}</Link>
            </Button>
            <Badge variant="signal" className="w-fit">
              {t("workspaceBadge")}
            </Badge>
          </div>
          <div>
            <h1 className="text-h1 font-semibold tracking-tight text-text">{name}</h1>
            <p className="mt-2 break-all font-mono text-caption text-muted">{groupPda}</p>
            <p className="mt-3 max-w-2xl text-body leading-7 text-muted">{t("workspaceSubtitle")}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="primary" size="md">
            <Link href={`/${locale}/groups/${groupPda}/contribute`}>{t("primaryCtaContribute")}</Link>
          </Button>
          <Button asChild variant="secondary" size="md">
            <Link href={`/${locale}/groups/${groupPda}/claim`}>{t("primaryCtaClaim")}</Link>
          </Button>
        </div>
      </header>

      {!wallet.connected ? (
        <Banner variant="info" className="bg-surface">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{t("connectPrompt")}</span>
            <WalletStatus />
          </div>
        </Banner>
      ) : null}

      <section className="grid border border-border/70 bg-surface shadow-1 md:grid-cols-4">
        <div className="border-b border-border/70 p-4 md:border-b-0 md:border-e">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted">{t("statusLabel")}</p>
          <p className="mt-2 font-mono text-body font-semibold text-text">{t("statusForming")}</p>
        </div>
        <div className="border-b border-border/70 p-4 md:border-b-0 md:border-e">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted">{t("walletLabel")}</p>
          <p className="mt-2 font-mono text-body font-semibold text-text">
            {wallet.connected && wallet.address ? shortPubkey(wallet.address) : t("walletDisconnected")}
          </p>
        </div>
        <div className="border-b border-border/70 p-4 md:border-b-0 md:border-e">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted">{t("nextDueLabel")}</p>
          <p className="mt-2 font-mono text-body font-semibold text-text">{t("pendingIndexer")}</p>
        </div>
        <div className="p-4">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted">{t("accessLabel")}</p>
          <p className="mt-2 text-body font-semibold text-text">{t("accessPrivate")}</p>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex flex-col gap-4">
          <h2 className="text-h2 font-semibold tracking-tight text-text">{t("operationsHeading")}</h2>
          <div className="divide-y divide-border/70 border-y border-border/70">
            {[t("operationInvite"), t("operationContribute"), t("operationClaim")].map((item) => (
              <div key={item} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <p className="text-body leading-7 text-muted">{item}</p>
                <Badge variant="outline">{t("pendingIndexer")}</Badge>
              </div>
            ))}
          </div>
        </section>

        <aside className="border border-border/70 bg-surface p-5 shadow-1">
          <h2 className="text-h3 font-semibold tracking-tight text-text">{t("metadataHeading")}</h2>
          <dl className="mt-4 flex flex-col gap-4">
            <div>
              <dt className="text-caption font-semibold uppercase tracking-[0.16em] text-muted">{t("nameLabel")}</dt>
              <dd className="mt-1 text-body text-text">{name}</dd>
            </div>
            <div>
              <dt className="text-caption font-semibold uppercase tracking-[0.16em] text-muted">{t("groupPdaLabel")}</dt>
              <dd className="mt-1 break-all font-mono text-caption text-text">{groupPda}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
    </WalletGate>
  );
}
