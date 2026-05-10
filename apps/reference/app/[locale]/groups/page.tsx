import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listDemoGroups } from "@/lib/member-app";

function formatDeadline(locale: string, unix: number | null): string {
  if (!unix) return "No deadline";
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(unix * 1000));
  } catch {
    return new Date(unix * 1000).toISOString();
  }
}

/**
 * Group list — uses demo fixtures; swap for indexer/Convex later.
 */
export default async function GroupsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("groups");
  const items = listDemoGroups();
  const nextDeadline =
    items
      .map((item) => item.nextDeadlineUnix)
      .filter((value): value is number => typeof value === "number")
      .sort((a, b) => a - b)[0] ?? null;
  const totalMembers = items.reduce((sum, item) => sum + item.memberCount, 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
      <header className="overflow-hidden rounded-3xl border border-border/70 bg-white/95 shadow-2">
        <div className="grid gap-8 bg-gradient-to-br from-white via-surface to-primary/10 p-6 md:grid-cols-[minmax(0,1fr)_22rem] md:p-8">
          <div className="flex flex-col justify-between gap-8">
            <div className="flex max-w-2xl flex-col gap-3">
              <Badge variant="outline" className="w-fit">
                Portfolio preview
              </Badge>
              <h1 className="text-h1 font-semibold tracking-tight text-text">{t("title")}</h1>
              <p className="max-w-2xl text-body leading-7 text-muted">{t("subtitle")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="primary" size="md">
                <Link href={`/${locale}/groups/${items[0]?.groupPda ?? ""}`}>Open featured circle</Link>
              </Button>
              <Button asChild variant="secondary" size="md">
                <Link href={`/${locale}/pilot`}>Try wallet-free preview</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-1">
              <p className="text-caption font-semibold uppercase tracking-wide text-muted">Circles</p>
              <p className="mt-2 font-mono text-h2 font-semibold text-text">{items.length}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-1">
              <p className="text-caption font-semibold uppercase tracking-wide text-muted">Members tracked</p>
              <p className="mt-2 font-mono text-h2 font-semibold text-text">{totalMembers}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-1">
              <p className="text-caption font-semibold uppercase tracking-wide text-muted">Next deadline</p>
              <p className="mt-2 font-mono text-caption font-semibold text-text">
                {formatDeadline(locale, nextDeadline)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {items.length === 0 ? (
        <Card className="border-border/70 bg-white/95 p-8 text-body text-muted shadow-1">
          {t("empty")}
        </Card>
      ) : (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-caption font-semibold uppercase tracking-[0.18em] text-primary">
                Active sample circles
              </p>
              <h2 className="mt-2 text-h2 font-semibold tracking-tight text-text">Choose a circle</h2>
            </div>
            <p className="max-w-md text-body text-muted">
              Review contribution rhythm, rotation status, and claim readiness before connecting a wallet.
            </p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2">
          {items.map((g) => (
            <li key={g.groupPda}>
              <Card className="h-full overflow-hidden rounded-2xl border-border/70 bg-white/95 shadow-1 transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-2">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-border/70 bg-surface2/60">
                  <div className="min-w-0">
                    <CardTitle className="text-h3">{g.name}</CardTitle>
                    <CardDescription className="mt-2 break-all font-mono text-caption">
                      {g.groupPda}
                    </CardDescription>
                  </div>
                  {g.isDemo ? <Badge variant="warn">{t("demoChip")}</Badge> : null}
                </CardHeader>
                <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-surface2/60 p-3">
                    <p className="text-caption text-muted">Members</p>
                    <p className="mt-1 font-mono text-body font-semibold text-text">{g.memberCount}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-surface2/60 p-3">
                    <p className="text-caption text-muted">Contribution</p>
                    <p className="mt-1 font-mono text-body font-semibold text-text">{g.contributionLabel}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-surface2/60 p-3">
                    <p className="text-caption text-muted">Next claim</p>
                    <p className="mt-1 font-mono text-caption font-semibold text-text">
                      {formatDeadline(locale, g.nextDeadlineUnix)}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="justify-end border-t border-border/70 bg-white p-5">
                  <Button asChild variant="primary" size="sm">
                    <Link href={`/${locale}/groups/${g.groupPda}`}>{t("open")}</Link>
                  </Button>
                </CardFooter>
              </Card>
            </li>
          ))}
          </ul>
        </section>
      )}
    </main>
  );
}
