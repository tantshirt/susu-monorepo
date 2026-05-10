"use client";

import { useTranslations } from "next-intl";
import type { GroupDetailViewModel } from "@/lib/member-app/types";
import { Eyebrow, ActionLink } from "@/components/member/DashboardPrimitives";
import { cn } from "@/lib/utils";

export interface JudgeDemoPathProps {
  locale: string;
  featured: GroupDetailViewModel;
  walletConnected: boolean;
}

/**
 * Single sample-circle handoff with clear next steps.
 */
export function JudgeDemoPath({ locale, featured, walletConnected }: JudgeDemoPathProps) {
  const t = useTranslations("dashboard");
  const hint = !walletConnected ? t("walletHintDisconnected") : t("walletHintConnected");

  const steps = [
    t("demoPathStepOne"),
    t("demoPathStepTwo"),
    t("demoPathStepThree"),
  ];

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-white shadow-1",
      )}
      data-component="SampleCirclePath"
      aria-labelledby="sample-circle-heading"
    >
      <div className="grid gap-0 lg:grid-cols-[1fr_minmax(0,1.1fr)]">
        <div
          className="relative min-h-[260px] overflow-hidden bg-primary/15 lg:min-h-[420px]"
          data-sample-circle-visual
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/susu-protection-curve.png)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-8">
            <Eyebrow>{t("storyDemoEyebrow")}</Eyebrow>
            <h2 id="sample-circle-heading" className="mt-6 text-h1 font-semibold tracking-tight text-text md:text-[48px] md:leading-[1.05]">
              {featured.name}
            </h2>
            <p className="mt-3 max-w-[32ch] text-body leading-7 text-muted">
              {t("featuredMeta", {
                count: featured.memberCount,
                contribution: featured.contributionLabel,
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-8 p-8 md:p-10">
          <div>
            <p className="text-body font-semibold text-text">{t("storyDemoIntro")}</p>
            <p className="mt-3 max-w-[58ch] text-body leading-7 text-muted">
              {t("storyDemoDescription")}
            </p>
            <ol className="mt-6 space-y-3">
              {steps.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-2xl bg-surface2 px-4 py-3 text-body font-medium leading-snug text-text"
                  data-sample-step={i}
                >
                  <span className="font-mono text-caption font-bold text-primary tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-caption font-medium leading-relaxed text-muted">{hint}</p>
          </div>

          <div className="rounded-[20px] bg-surface2 p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
              {t("demoGroupFixtureLabel")}
            </p>
            <p className="mt-2 break-all font-mono text-caption text-text/80">{featured.groupPda}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 [&>a]:w-full">
            <ActionLink href={`/${locale}/groups/${featured.groupPda}`} variant="light">
              {t("viewGroupDetail")}
            </ActionLink>
            <ActionLink href={`/${locale}/groups/${featured.groupPda}/claim`} variant="light">
              {t("claimLink")}
            </ActionLink>
            <ActionLink href={`/${locale}/groups`} variant="light">
              {t("viewGroups")}
            </ActionLink>
            <ActionLink href={`/${locale}/docs/curve`} variant="light">
              {t("exploreCurve")}
            </ActionLink>
          </div>
        </div>
      </div>
    </section>
  );
}
