"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RotationCard } from "@/components/susu/RotationCard";
import type { GroupDetailViewModel } from "@/lib/member-app/types";
import { Banner } from "@/components/susu/Banner";

export interface GroupDetailClientProps {
  detail: GroupDetailViewModel;
  locale: string;
}

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

function StatTile({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-1">
      <p className="text-caption font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-mono text-h3 font-semibold text-text">{value}</p>
      {detail ? <p className="mt-1 text-caption text-muted">{detail}</p> : null}
    </div>
  );
}

/**
 * Organism — group detail with rotation cards (fixtures until SDK wiring).
 */
export function GroupDetailClient({ detail, locale }: GroupDetailClientProps) {
  const t = useTranslations("groupDetail");
  const tGroups = useTranslations("groups");
  const activeRotation = detail.rotations[detail.activeRotationIndex] ?? detail.rotations[0];
  const receivedTotal = detail.rotations.reduce((sum, rot) => sum + rot.contributionsReceived, 0);
  const requiredTotal = detail.rotations.reduce((sum, rot) => sum + rot.contributionsRequired, 0);
  const collectionProgress =
    requiredTotal > 0 ? Math.min(100, Math.max(0, (receivedTotal / requiredTotal) * 100)) : 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-white/95 shadow-2">
        <div className="grid gap-8 bg-gradient-to-br from-white via-surface to-secondary/10 p-6 md:grid-cols-[minmax(0,1fr)_20rem] md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="w-fit text-muted hover:text-text">
                <Link href={`/${locale}/groups`}>← {t("backLink")}</Link>
              </Button>
              {detail.isDemo ? (
                <Badge variant="warn" className="w-fit">
                  {tGroups("demoChip")}
                </Badge>
              ) : null}
              <Badge variant="signal" className="w-fit">
                Protocol preview
              </Badge>
            </div>
            <div className="flex max-w-3xl flex-col gap-3">
              <h1 className="text-h1 font-semibold tracking-tight text-text">{detail.name}</h1>
              <p className="break-all font-mono text-caption text-muted">{detail.groupPda}</p>
              <p className="max-w-2xl text-body leading-7 text-muted">
                Review the circle health, payment progress, and rotation schedule before moving funds.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="primary" size="md">
                <Link href={`/${locale}/groups/${detail.groupPda}/contribute`}>
                  {t("primaryCtaContribute")}
                </Link>
              </Button>
              <Button asChild variant="secondary" size="md">
                <Link href={`/${locale}/groups/${detail.groupPda}/claim`}>{t("primaryCtaClaim")}</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-1">
            <p className="text-caption font-semibold uppercase tracking-wide text-muted">Current rotation</p>
            <p className="mt-3 font-mono text-h2 font-semibold text-text">
              {activeRotation ? `${activeRotation.i} / ${activeRotation.n}` : "0 / 0"}
            </p>
            <p className="mt-1 text-caption text-muted">
              Next claim window: {formatDeadline(locale, detail.nextDeadlineUnix)}
            </p>
            <div className="mt-5">
              <div className="mb-2 flex justify-between gap-3 text-caption text-muted">
                <span>Collected</span>
                <span className="font-mono text-text">
                  {receivedTotal} / {requiredTotal}
                </span>
              </div>
              <Progress value={collectionProgress} />
            </div>
          </div>
        </div>
      </section>

      <Banner variant="info" className="rounded-2xl border-border/70 bg-white/90">
        {t("fixtureLabel")}
      </Banner>

      <section className="grid gap-4 md:grid-cols-3">
        <StatTile label={t("members")} value={detail.memberCount} detail="Members in this schedule" />
        <StatTile label={t("contribution")} value={detail.contributionLabel} detail={detail.mintSymbol} />
        <StatTile label="Next claim" value={formatDeadline(locale, detail.nextDeadlineUnix)} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <Card className="overflow-hidden rounded-2xl border-border/70 bg-white/95 shadow-1">
          <CardHeader className="border-b border-border/70 bg-surface2/60">
            <CardTitle className="text-h3">{t("collateral")}</CardTitle>
            <CardDescription>Risk and protection summary</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 p-5">
            <p className="text-body leading-7 text-muted">{detail.collateralSummary}</p>
            <div className="rounded-xl border border-border/70 bg-primary/10 p-4">
              <p className="font-mono text-caption font-semibold uppercase tracking-[0.18em] text-primary">
                Protocol health
              </p>
              <p className="mt-2 text-body text-text">
                Later recipients carry higher protection requirements so the circle remains resilient.
              </p>
            </div>
            <div className="grid gap-3">
              {detail.rotations.map((rot) => (
                <div
                  key={`member-${rot.i}-${rot.recipient}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-surface2/60 p-3"
                >
                  <div>
                    <p className="font-mono text-caption font-semibold text-text">
                      Rotation {rot.i}
                    </p>
                    <p className="font-mono text-caption text-muted">
                      {rot.recipient.slice(0, 4)}...{rot.recipient.slice(-4)}
                    </p>
                  </div>
                  <Badge variant={rot.state === "active" ? "signal" : rot.state === "pending" ? "warn" : "outline"}>
                    {rot.state}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-border/70 bg-white/95 shadow-1">
          <CardHeader className="border-b border-border/70 bg-surface2/60">
            <CardTitle className="text-h3">{t("rotationsHeading")}</CardTitle>
            <CardDescription>Recipient order, contribution progress, and claim timing</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-5">
            {detail.rotations.map((rot) => (
              <RotationCard
                key={`${rot.i}-${rot.recipient}`}
                rotation={{
                  i: rot.i,
                  n: rot.n,
                  recipient: rot.recipient,
                  state: rot.state,
                  contributionsReceived: rot.contributionsReceived,
                  contributionsRequired: rot.contributionsRequired,
                  claimDeadlineUnix: rot.claimDeadlineUnix,
                }}
                locale={locale}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
