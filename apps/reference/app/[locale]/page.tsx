import { useTranslations } from "next-intl";

/**
 * Locale-aware home page. Per UX-DR46 the page uses translation keys instead
 * of string literals so every locale renders without code edits.
 */
export default function LocaleHome() {
  const t = useTranslations("app");
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between gap-12 py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="max-w-md text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          {t("welcome")}
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          {t("tagline")}
        </p>
        <p className="max-w-md text-base leading-7 text-zinc-500 dark:text-zinc-500">
          {t("getStarted")}
        </p>
      </main>
    </div>
  );
}
