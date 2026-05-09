import { useTranslations } from "next-intl";

/**
 * Locale-aware home page. Per UX-DR46 the page uses translation keys instead
 * of string literals so every locale renders without code edits.
 *
 * Story 7.17 — mobile-first responsive pass. The page now:
 *   - Uses semantic tokens (`bg-bg`, `text-text`, `text-muted`) instead of
 *     `bg-zinc-50 / dark:bg-black` so it follows the cross-skin invariants
 *     from UX-DR2 instead of hard-coded palette literals.
 *   - Pulls hero typography down to `text-display-2` (40px) at the 360px
 *     floor and restores `text-display-1` (56px) at md+, matching the
 *     responsive type contract from Story 7.17.
 *   - Pads at `px-4` (16px) on mobile and `md:px-8` desktop instead of the
 *     previous `px-16` (64px) which left only 232px of content width on a
 *     360px viewport.
 */
export default function LocaleHome() {
  const t = useTranslations("app");
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-bg font-sans">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-between gap-8 px-4 py-12 md:items-start md:gap-12 md:px-8 md:py-24">
        <h1 className="max-w-md text-display-2 font-semibold tracking-tight text-text md:text-display-1">
          {t("welcome")}
        </h1>
        <p className="max-w-md text-body text-muted md:text-lg md:leading-8">
          {t("tagline")}
        </p>
        <p className="max-w-md text-body text-muted md:text-base md:leading-7">
          {t("getStarted")}
        </p>
      </main>
    </div>
  );
}
