"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { WalletStatus } from "@/components/nav/WalletStatus";
import { WalletGate } from "@/components/auth/WalletGate";
import { Banner } from "@/components/susu/Banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInviteLink } from "@/lib/convex/use-invite-link";
import { useWallet } from "@/lib/wallet/useWallet";

interface JoinGroupClientProps {
  locale: string;
}

function normalizeAccessCode(value: string): string {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function shortPubkey(address: string, head = 6, tail = 6): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

export function JoinGroupClient({ locale }: JoinGroupClientProps) {
  const t = useTranslations("joinGroup");
  const wallet = useWallet();
  const [accessCode, setAccessCode] = React.useState("");
  const [submittedCode, setSubmittedCode] = React.useState<string | null>(null);
  const invite = useInviteLink(submittedCode);
  const normalizedCode = normalizeAccessCode(accessCode);
  const canLookup = normalizedCode.length >= 4;
  const isLoading = submittedCode !== null && invite === undefined;
  const isInvalid = submittedCode !== null && invite === null;

  function lookupInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canLookup) return;
    setSubmittedCode(normalizedCode);
  }

  return (
    <WalletGate locale={locale}>
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
      <header className="flex flex-col justify-between gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end">
        <div className="flex max-w-3xl flex-col gap-3">
          <Badge variant="signal" className="w-fit">
            {t("badge")}
          </Badge>
          <h1 className="text-h1 font-semibold tracking-tight text-text">{t("title")}</h1>
          <p className="max-w-2xl text-body leading-7 text-muted">{t("subtitle")}</p>
        </div>
        <Button asChild variant="secondary" size="md">
          <Link href={`/${locale}`}>{t("backToDashboard")}</Link>
        </Button>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <form onSubmit={lookupInvite} className="border border-border/70 bg-surface p-5 shadow-1">
            <div className="flex flex-col gap-2">
              <Label htmlFor="join-access-code">{t("codeLabel")}</Label>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                  id="join-access-code"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  autoComplete="off"
                  inputMode="text"
                  className="font-mono uppercase"
                  placeholder={t("codePlaceholder")}
                />
                <Button type="submit" variant="primary" size="md" disabled={!canLookup || isLoading}>
                  {isLoading ? t("lookupLoading") : t("lookupButton")}
                </Button>
              </div>
              <p className="text-caption leading-6 text-muted">{t("codeHelp")}</p>
            </div>
          </form>

          {isInvalid ? (
            <Banner variant="danger">{t("invalidCode")}</Banner>
          ) : null}

          {invite ? (
            <section className="border border-border/70 bg-surface shadow-1">
              <div className="border-b border-border/70 bg-surface2/70 px-5 py-4">
                <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted">
                  {t("previewEyebrow")}
                </p>
                <h2 className="mt-2 text-h2 font-semibold tracking-tight text-text">
                  {t("previewTitle")}
                </h2>
              </div>
              <dl className="divide-y divide-border/70">
                <div className="grid gap-2 px-5 py-4 md:grid-cols-[12rem_minmax(0,1fr)]">
                  <dt className="text-caption font-semibold uppercase tracking-[0.16em] text-muted">
                    {t("previewGroup")}
                  </dt>
                  <dd className="break-all font-mono text-body text-text">{invite.groupPda}</dd>
                </div>
                <div className="grid gap-2 px-5 py-4 md:grid-cols-[12rem_minmax(0,1fr)]">
                  <dt className="text-caption font-semibold uppercase tracking-[0.16em] text-muted">
                    {t("previewCode")}
                  </dt>
                  <dd className="font-mono text-body text-text">{invite.token}</dd>
                </div>
                <div className="grid gap-2 px-5 py-4 md:grid-cols-[12rem_minmax(0,1fr)]">
                  <dt className="text-caption font-semibold uppercase tracking-[0.16em] text-muted">
                    {t("previewWallet")}
                  </dt>
                  <dd className="font-mono text-body text-text">
                    {wallet.connected && wallet.address ? shortPubkey(wallet.address) : t("walletRequired")}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-col gap-3 border-t border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-body leading-7 text-muted">{t("confirmHelp")}</p>
                {wallet.connected ? (
                  <Button asChild variant="primary" size="md">
                    <Link href={`/${locale}/groups/${invite.groupPda}`}>{t("openGroup")}</Link>
                  </Button>
                ) : (
                  <WalletStatus />
                )}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-5">
          <section className="border border-border/70 bg-surface p-5 shadow-1">
            <h2 className="text-h3 font-semibold tracking-tight text-text">{t("rulesTitle")}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {[t("ruleAccessCode"), t("ruleWallet"), t("rulePreview"), t("ruleNoDiscovery")].map((item) => (
                <li key={item} className="flex gap-3 text-body leading-7 text-muted">
                  <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
          <Banner variant="info">{t("convexFallbackNote")}</Banner>
        </aside>
      </section>
    </main>
    </WalletGate>
  );
}
