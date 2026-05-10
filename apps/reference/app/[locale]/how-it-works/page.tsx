import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("howItWorks");
  const steps = [
    { title: t("stepCreateTitle"), body: t("stepCreateBody") },
    { title: t("stepShareTitle"), body: t("stepShareBody") },
    { title: t("stepJoinTitle"), body: t("stepJoinBody") },
    { title: t("stepContributeTitle"), body: t("stepContributeBody") },
    { title: t("stepRotateTitle"), body: t("stepRotateBody") },
    { title: t("stepCompleteTitle"), body: t("stepCompleteBody") },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 md:px-8 md:py-14">
      <header className="grid gap-6 border-b border-border/70 pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="flex max-w-3xl flex-col gap-3">
          <Badge variant="signal" className="w-fit">
            {t("badge")}
          </Badge>
          <h1 className="text-display-2 font-semibold tracking-tight text-text md:text-display-1">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-body leading-7 text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="primary" size="md">
            <Link href={`/${locale}/groups/new`}>{t("createCta")}</Link>
          </Button>
          <Button asChild variant="secondary" size="md">
            <Link href={`/${locale}/join`}>{t("joinCta")}</Link>
          </Button>
        </div>
      </header>

      <section aria-label={t("flowAriaLabel")} className="relative">
        <div aria-hidden className="absolute start-6 top-0 hidden h-full w-px bg-border md:block" />
        <ol className="grid gap-5">
          {steps.map((step, index) => (
            <li key={step.title} className="relative grid gap-4 md:grid-cols-[3rem_minmax(0,1fr)]">
              <div className="z-10 flex size-12 items-center justify-center rounded-full border border-border bg-surface font-mono text-body font-semibold text-primary shadow-1">
                {index + 1}
              </div>
              <div className="border border-border/70 bg-surface p-5 shadow-1">
                <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted">
                  {t("stepLabel", { index: index + 1 })}
                </p>
                <h2 className="mt-2 text-h3 font-semibold tracking-tight text-text">{step.title}</h2>
                <p className="mt-2 max-w-3xl text-body leading-7 text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 border border-primary/20 bg-primary/10 p-5 md:grid-cols-3">
        {[t("trustAccess"), t("trustSimulation"), t("trustReceipts")].map((item) => (
          <p key={item} className="text-body font-semibold leading-7 text-text">
            {item}
          </p>
        ))}
      </section>
    </main>
  );
}
