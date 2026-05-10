"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useWallet } from "@/lib/wallet/useWallet";
import {
  DEMO_GROUP_PRIMARY_PDA,
  getDemoGroupDetail,
} from "@/lib/member-app";
import { TrustStrip } from "@/components/member/TrustStrip";
import { LandingStorySpine } from "@/components/member/LandingStorySpine";

const heroImageUrl = "https://framerusercontent.com/images/BBQSOOzFQf6aBaNHTXKI0yU.png";
const noiseImageUrl = "https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png";

function HeroEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="w-fit rounded-pill border border-text/10 bg-white/85 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
      {children}
    </span>
  );
}

export interface MemberDashboardProps {
  locale: string;
}

/**
 * Member home dashboard — client chart for wallet + CTAs.
 */
export function MemberDashboard({ locale }: MemberDashboardProps) {
  const t = useTranslations("dashboard");
  const tApp = useTranslations("app");
  const wallet = useWallet();
  const featured = getDemoGroupDetail(DEMO_GROUP_PRIMARY_PDA)!;

  return (
    <div className="flex flex-1 flex-col bg-bg font-sans">
      <main className="flex w-full flex-1 flex-col overflow-hidden bg-bg">
        <section className="relative -mt-28 overflow-hidden pt-28 sm:-mt-32 sm:pt-32">
          <div
            className="absolute inset-x-0 top-0 h-[min(88svh,760px)] bg-cover bg-[position:center_18%] sm:h-[min(90svh,820px)] sm:bg-[position:center_24%] md:bg-[position:center_30%]"
            style={{ backgroundImage: `url(${heroImageUrl})` }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[min(88svh,760px)] bg-gradient-to-b from-text/62 via-text/18 to-bg sm:h-[min(90svh,820px)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[min(88svh,760px)] bg-gradient-to-r from-text/34 via-transparent to-text/24 sm:h-[min(90svh,820px)]"
          />
          <div className="absolute inset-x-0 top-0 h-[min(88svh,760px)] bg-text/10 sm:h-[min(90svh,820px)]" />
          <div
            className="absolute inset-x-0 top-0 h-[min(88svh,760px)] opacity-25 mix-blend-soft-light sm:h-[min(90svh,820px)]"
            style={{ backgroundImage: `url(${noiseImageUrl})` }}
          />
          <div className="relative z-10 mx-auto flex min-h-[min(78svh,700px)] max-w-6xl flex-col items-center px-4 pb-16 pt-14 text-center sm:min-h-[min(80svh,760px)] sm:pt-20 md:px-10 md:pt-16">
            <p className="mt-[clamp(4rem,16vh,9rem)] font-display text-[clamp(3.75rem,12vw,10rem)] font-semibold leading-none tracking-[-0.08em] text-white drop-shadow-[0_14px_34px_rgba(0,0,0,0.32)]">
              Susu
            </p>
          </div>
          <div className="relative z-20 mx-auto -mt-20 flex w-full max-w-6xl px-4 pb-16 sm:-mt-24 md:px-10 md:pb-20">
            <div className="mx-auto flex w-full max-w-[38rem] flex-col items-center gap-5 rounded-2xl border border-white/70 bg-bg/92 p-6 text-center shadow-2 backdrop-blur-xl sm:p-8 md:mx-0 md:items-start md:p-10 md:text-start">
              <HeroEyebrow>{t("heroBadge")}</HeroEyebrow>
              <h1 className="text-display-2 font-medium tracking-tight text-text md:text-display-1 md:leading-[1.05]">
                {t("heroTitle")}
              </h1>
              <p className="max-w-[38rem] text-body font-medium leading-7 text-muted md:text-[17px] md:leading-8">
                {t("heroSubtitle")}
              </p>
              <div
                className="flex w-full flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center md:justify-start"
                aria-label="Primary actions"
              >
                <Link
                  href={`/${locale}/groups/${DEMO_GROUP_PRIMARY_PDA}`}
                  className="inline-flex h-12 min-h-11 w-full items-center justify-center rounded-pill bg-warn px-7 text-sm font-medium text-text shadow-2 ring-1 ring-black/10 transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-[0.97] active:brightness-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warn focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:w-auto"
                >
                  {t("demoGroupCta")}
                </Link>
              </div>
              <p className="max-w-[34rem] text-caption font-medium leading-relaxed text-muted">
                {tApp("getStarted")}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-[1128px] flex-col gap-8 px-4 py-14 md:px-6 md:py-20">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              {t("hackathonBadge")}
            </p>
            <TrustStrip className="w-full" />
          </div>
        </section>

        <LandingStorySpine locale={locale} featured={featured} walletConnected={wallet.connected} />
      </main>
    </div>
  );
}
