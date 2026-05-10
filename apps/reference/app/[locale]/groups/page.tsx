import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WalletGate } from "@/components/auth/WalletGate";

/**
 * Groups workspace — production shell for created and joined circles.
 */
export default async function GroupsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("groups");

  return (
    <WalletGate locale={locale}>
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
      <header className="flex flex-col justify-between gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end">
        <div className="flex max-w-3xl flex-col gap-3">
          <Badge variant="signal" className="w-fit">
            {t("workspaceBadge")}
          </Badge>
          <h1 className="text-h1 font-semibold tracking-tight text-text">{t("title")}</h1>
          <p className="max-w-2xl text-body leading-7 text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="primary" size="md">
            <Link href={`/${locale}/groups/new`}>{t("create")}</Link>
          </Button>
          <Button asChild variant="secondary" size="md">
            <Link href={`/${locale}/join`}>{t("join")}</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="border border-border/70 bg-surface p-4 shadow-1">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted">{t("createdMetric")}</p>
          <p className="mt-2 font-mono text-h2 font-semibold text-text">0</p>
        </div>
        <div className="border border-border/70 bg-surface p-4 shadow-1">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted">{t("joinedMetric")}</p>
          <p className="mt-2 font-mono text-h2 font-semibold text-text">0</p>
        </div>
        <div className="border border-border/70 bg-surface p-4 shadow-1">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted">{t("nextDeadlineMetric")}</p>
          <p className="mt-2 font-mono text-body font-semibold text-text">{t("none")}</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 border-b border-border/70">
          <span className="border-b-2 border-primary px-3 py-2 text-body font-semibold text-text">
            {t("allGroups")}
          </span>
          <span className="px-3 py-2 text-body font-medium text-muted">{t("createdGroups")}</span>
          <span className="px-3 py-2 text-body font-medium text-muted">{t("joinedGroups")}</span>
        </div>
        <div className="overflow-x-auto border border-border/70 bg-surface">
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="border-b border-border/70 bg-surface2/70">
              <tr className="text-caption font-semibold uppercase tracking-[0.16em] text-muted">
                <th className="px-4 py-3 text-start">{t("tableName")}</th>
                <th className="px-4 py-3 text-start">{t("tableRole")}</th>
                <th className="px-4 py-3 text-start">{t("tableStatus")}</th>
                <th className="px-4 py-3 text-start">{t("tableNext")}</th>
                <th className="px-4 py-3 text-end">{t("tableAction")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <p className="text-body font-semibold text-text">{t("emptyTitle")}</p>
                  <p className="mx-auto mt-2 max-w-xl text-body leading-7 text-muted">{t("empty")}</p>
                  <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button asChild variant="primary" size="sm">
                      <Link href={`/${locale}/groups/new`}>{t("create")}</Link>
                    </Button>
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/${locale}/join`}>{t("join")}</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
    </WalletGate>
  );
}
