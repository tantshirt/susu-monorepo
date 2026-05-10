import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { CurveVisualizer } from "@/components/susu/CurveVisualizer";

/**
 * Story 8.4 — `/[locale]/docs/curve` route.
 *
 * Embeds the interactive `<CurveVisualizer />` so visitors can scrub the
 * parameters (n, contribution) and highlight late turns without leaving the
 * docs surface.
 *
 * Locale-aware: pulls user-facing copy through `next-intl` so the page
 * renders correctly under all six supported locales (en, vi, ar, es, yo,
 * ht-kreyol). RTL flips inherit from the surrounding `[locale]` layout
 * (Story 7.7).
 *
 * No transition animations on slider drags — see CurveVisualizer note on
 * `prefers-reduced-motion`.
 */
export default async function DocsCurvePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "docs.curve" });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 md:px-8 md:py-16">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-h2 font-semibold tracking-tight text-text">{t("title")}</h1>
        <p className="text-body text-muted">{t("intro")}</p>
      </header>

      <section className="rounded-xl border border-border/80 bg-surface p-6 shadow-1">
        <CurveVisualizer
          interactive
          n={8}
          contribution={100}
          size="lg"
          locale={locale}
          copy={{
            sliderN: t("sliderN"),
            sliderContribution: t("sliderContribution"),
            cartelToggle: t("cartelToggle"),
            cartelCallout: t("cartelCallout"),
          }}
        />
      </section>
    </main>
  );
}
