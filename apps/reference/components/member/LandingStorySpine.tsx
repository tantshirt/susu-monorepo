"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { GroupDetailViewModel } from "@/lib/member-app/types";
import { Eyebrow, ActionLink } from "@/components/member/DashboardPrimitives";
import { ProtocolFlowVisual } from "@/components/member/ProtocolFlowVisual";
import { JudgeDemoPath } from "@/components/member/JudgeDemoPath";
import { DEMO_GROUP_PRIMARY_PDA } from "@/lib/member-app";
import { prefersReducedMotion } from "@/lib/a11y/reduced-motion";
import { cn } from "@/lib/utils";

const featureImageUrl = "/susu-problem-illustration.png";
const solutionImageUrl = "/susu-solution-illustration.png";

export interface LandingStorySpineProps {
  locale: string;
  featured: GroupDetailViewModel;
  walletConnected: boolean;
}

function StoryPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("opacity-100 translate-y-0", className)}
      data-story-reveal
    >
      {children}
    </div>
  );
}

/**
 * Lower half: plain-English story spine for problem → solution → flow → try it.
 */
export function LandingStorySpine({ locale, featured, walletConnected }: LandingStorySpineProps) {
  const t = useTranslations("dashboard");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollRoot = rootRef.current;
    if (!scrollRoot || prefersReducedMotion()) return;
    const storyMount: HTMLDivElement = scrollRoot;

    let revertedEarly = false;
    const ctxRef: { current: { revert: () => void } | null } = { current: null };

    async function boot() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (revertedEarly) return;

      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        const panels = gsap.utils.toArray(
          "[data-story-reveal]",
          storyMount,
        ) as HTMLElement[];
        if (panels.length) {
          gsap.set(panels, { opacity: 0, y: 28 });
          ScrollTrigger.batch(panels, {
            start: "top 88%",
            onEnter: (batch: Element[]) => {
              gsap.to(batch, {
                opacity: 1,
                y: 0,
                duration: 0.55,
                stagger: 0.08,
                ease: "power2.out",
                overwrite: true,
              });
            },
            once: true,
          });
        }

        const viz = storyMount.querySelector<HTMLElement>(`[data-component="ProtocolFlowVisual"]`);
        if (viz) {
          const circles = viz.querySelectorAll<HTMLElement>("[data-protocol-node]");
          if (circles.length) {
            gsap.set(circles, { opacity: 0.35, scale: 0.92, transformOrigin: "center center" });
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: viz,
                start: "top 75%",
                end: "bottom 50%",
                scrub: 0.45,
              },
            });
            circles.forEach((node, i) => {
              tl.to(
                node,
                {
                  opacity: 1,
                  scale: 1,
                  duration: 0.55,
                  ease: "power1.out",
                },
                i * 0.14,
              );
            });
          }
        }

        ScrollTrigger.refresh();
      }, storyMount);

      ctxRef.current = ctx;
      if (revertedEarly) {
        ctx.revert();
      }
    }

    void boot();

    return () => {
      revertedEarly = true;
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
  }, []);

  const trustBullets = [
    { title: t("trustPillarSimulateTitle"), body: t("trustPillarSimulateBody") },
    { title: t("trustPillarReceiptTitle"), body: t("trustPillarReceiptBody") },
    { title: t("trustPillarRulesTitle"), body: t("trustPillarRulesBody") },
  ];

  return (
    <div ref={rootRef}>
      <section
        id="how-it-works"
        className="mx-auto flex w-full max-w-[1128px] scroll-mt-28 flex-col gap-12 px-4 pb-12 md:scroll-mt-32 md:gap-14 md:px-6 md:pb-16"
      >
        <StoryPanel className="flex max-w-[720px] flex-col gap-3">
          <Eyebrow>{t("howItWorksTitle")}</Eyebrow>
          <h2 className="text-h1 font-semibold tracking-tight text-text md:text-[56px] md:leading-[1]">
            {t("storyHeroTitle")}
          </h2>
          <p className="max-w-[600px] text-body leading-7 text-muted">{t("storyHeroSubtitle")}</p>
        </StoryPanel>

        <StoryPanel
          className="rounded-2xl border border-border bg-white p-8 shadow-1 md:flex md:min-h-[280px] md:gap-10 md:p-12"
        >
          <div className="relative mb-8 h-48 shrink-0 overflow-hidden rounded-xl md:mb-0 md:h-auto md:w-[min(42%,380px)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${featureImageUrl})` }}
            />
            <div className="absolute inset-0 bg-text/35" aria-hidden />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-4">
            <Eyebrow>{t("problemEyebrow")}</Eyebrow>
            <h3 className="text-h2 font-semibold tracking-tight text-text">{t("problemTitle")}</h3>
            <p className="max-w-[52ch] text-body leading-7 text-muted">{t("problemBody")}</p>
          </div>
        </StoryPanel>

        <StoryPanel
          className="rounded-2xl border border-border bg-surface p-8 shadow-1 md:flex md:min-h-[280px] md:flex-row-reverse md:gap-10 md:p-12"
        >
          <div className="relative mb-8 h-48 shrink-0 overflow-hidden rounded-xl bg-surface2 md:mb-0 md:h-auto md:w-[min(42%,380px)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${solutionImageUrl})` }}
            />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-4">
            <Eyebrow>{t("solutionEyebrow")}</Eyebrow>
            <h3 className="text-h2 font-semibold tracking-tight text-text">{t("solutionTitle")}</h3>
            <p className="max-w-[52ch] text-body leading-7 text-muted">{t("solutionBody")}</p>
          </div>
        </StoryPanel>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12 lg:items-start">
          <StoryPanel className="flex flex-col gap-4">
            <Eyebrow>{t("mechanismEyebrow")}</Eyebrow>
            <h3 className="text-h2 font-semibold tracking-tight text-text">{t("mechanismTitle")}</h3>
            <p className="text-body leading-7 text-muted">{t("mechanismBody")}</p>
            <ul className="mt-2 space-y-3 text-body text-muted">
              <li className="flex gap-3">
                <span className="font-mono text-caption font-bold text-primary">●</span>
                <span>{t("mechanismBulletRotate")}</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-caption font-bold text-primary">●</span>
                <span>{t("mechanismBulletSim")}</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-caption font-bold text-primary">●</span>
                <span>{t("mechanismBulletReceipt")}</span>
              </li>
            </ul>
          </StoryPanel>
          <StoryPanel>
            <ProtocolFlowVisual />
          </StoryPanel>
        </div>

        <StoryPanel>
          <div className="rounded-2xl border border-border bg-primary/15 p-8 shadow-1 md:p-10">
            <Eyebrow>{t("trustEyebrow")}</Eyebrow>
            <h3 className="mt-6 text-h2 font-semibold tracking-tight text-text">{t("trustTitle")}</h3>
            <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
              {trustBullets.map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 md:border-e md:border-border md:pe-8 last:md:border-e-0 last:md:pe-0"
                >
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="text-h3 font-semibold leading-tight text-text">{item.title}</p>
                  <p className="text-body leading-7 text-muted">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </StoryPanel>
      </section>

      <section className="mx-auto flex w-full max-w-[1128px] flex-col gap-12 px-4 pb-16 md:px-6 md:pb-24">
        <StoryPanel>
          <JudgeDemoPath locale={locale} featured={featured} walletConnected={walletConnected} />
        </StoryPanel>

        <StoryPanel>
          <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-secondary/25 via-bg to-primary/15 p-8 shadow-1 md:p-12">
            <Eyebrow>{t("closingEyebrow")}</Eyebrow>
            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-h1 font-semibold tracking-tight text-text md:text-[52px] md:leading-[1.05]">
                  {t("closingTitle")}
                </h2>
                <p className="mt-4 text-body leading-7 text-muted">{t("closingBody")}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
                <ActionLink href={`/${locale}/groups/${DEMO_GROUP_PRIMARY_PDA}`}>
                  {t("demoGroupCta")}
                </ActionLink>
                <ActionLink href={`/${locale}/docs/curve`} variant="light">
                  {t("exploreCurve")}
                </ActionLink>
              </div>
            </div>
          </div>
        </StoryPanel>
      </section>
    </div>
  );
}
