"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { WalletStatus } from "@/components/nav/WalletStatus";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet/useWallet";

interface WalletGateProps {
  locale: string;
  children: ReactNode;
}

export function WalletGate({ locale, children }: WalletGateProps) {
  const wallet = useWallet();
  const t = useTranslations("authGate");

  if (wallet.connected) {
    return <>{children}</>;
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-6rem)] w-full max-w-5xl items-center justify-center px-4 py-10 md:px-8">
      <section className="flex w-full max-w-2xl flex-col items-center gap-5 border border-border/70 bg-bg p-6 text-center shadow-2 md:p-10">
        <p className="font-mono text-caption font-semibold uppercase tracking-[0.22em] text-muted">
          {t("eyebrow")}
        </p>
        <h1 className="text-display-2 font-semibold tracking-tight text-text md:text-display-1">
          {t("title")}
        </h1>
        <p className="max-w-xl text-body leading-7 text-muted">{t("body")}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <WalletStatus />
          <Button asChild variant="secondary" size="sm">
            <Link href={`/${locale}/how-it-works`}>{t("howItWorks")}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
