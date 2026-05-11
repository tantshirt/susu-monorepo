import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/susu/MemberAvatar";
import { cn } from "@/lib/utils";

/**
 * `<RotationCard />` — single rotation slot summary card. Story 7.11.
 *
 * Server Component built on the shadcn `Card` primitive. Renders:
 *
 *  - rotation index `i` of `n`
 *  - recipient `<MemberAvatar />` and truncated address
 *  - state `Badge` (pending / active / claimed)
 *  - contribution progress bar (received / required)
 *  - claim deadline (caller-formatted Unix seconds → readable string)
 *  - action button: "Claim now" while active, "View details" otherwise
 *
 * All user-facing strings come from next-intl (`rotation.*`). Token-only
 * Tailwind classes — no hex, no directional modifiers. Cross-skin clean.
 *
 * Consumed by Story 7.14 (cycle list), 7.15 (pay flow), 7.17 (group detail),
 * 8.1 (README hero embed).
 */
export type RotationState = "pending" | "active" | "claimed";

export interface RotationCardData {
  /** Zero- or one-based rotation index — caller's choice; we just render. */
  i: number;
  /** Group size. */
  n: number;
  /** Recipient pubkey (base58). */
  recipient: string;
  /** Lifecycle state of this rotation. */
  state: RotationState;
  /** Contributions already received for this rotation. */
  contributionsReceived: number;
  /** Contributions required to close this rotation. */
  contributionsRequired: number;
  /** Claim deadline, Unix epoch seconds. */
  claimDeadlineUnix: number;
}

export interface RotationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  rotation: RotationCardData;
  /** BCP-47 locale tag. Used for `Intl.DateTimeFormat` deadline rendering. */
  locale: string;
  /** Optional display name for the recipient (Convex / off-chain metadata). */
  recipientDisplayName?: string | null;
}

function truncatePubkey(pubkey: string): string {
  if (pubkey.length <= 8) return pubkey;
  return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
}

function stateBadgeVariant(state: RotationState): "signal" | "warn" | "outline" {
  if (state === "active") return "signal";
  if (state === "pending") return "warn";
  return "outline";
}

export function RotationCard({
  rotation,
  locale,
  recipientDisplayName,
  className,
  ...props
}: RotationCardProps) {
  const t = useTranslations("rotation");
  const {
    i,
    n,
    recipient,
    state,
    contributionsReceived,
    contributionsRequired,
    claimDeadlineUnix,
  } = rotation;

  const stateLabel =
    state === "active"
      ? t("stateActive")
      : state === "claimed"
        ? t("stateClaimed")
        : t("statePending");

  const progressValue =
    contributionsRequired > 0
      ? Math.min(100, Math.max(0, (contributionsReceived / contributionsRequired) * 100))
      : 0;

  const deadlineLabel = (() => {
    try {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(claimDeadlineUnix * 1000));
    } catch {
      // Fallback for unsupported locales — never throws upstream.
      return new Date(claimDeadlineUnix * 1000).toISOString();
    }
  })();

  const isActionable = state === "active";
  const paddedIndex = String(i).padStart(2, "0");

  return (
    <Card
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border-border/70 bg-white/95 shadow-1 transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-2",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className={cn(
          "absolute inset-y-0 start-0 w-1",
          state === "active"
            ? "bg-primary"
            : state === "claimed"
              ? "bg-signal"
              : "bg-warn",
        )}
      />
      <CardHeader className="gap-4 p-5 ps-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface2 font-mono text-caption font-semibold text-primary">
              {paddedIndex}
            </div>
            <div className="min-w-0">
              <CardTitle>{t("title", { index: i, total: n })}</CardTitle>
              <CardDescription className="mt-1">{t("recipient")}</CardDescription>
            </div>
          </div>
          <Badge variant={stateBadgeVariant(state)} className="shrink-0">
            {stateLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-5 pt-0 ps-6 md:grid-cols-[minmax(0,1fr)_minmax(14rem,0.8fr)]">
        <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-border/70 bg-surface2/60 p-4">
          <div className="flex items-center gap-3">
            <MemberAvatar
              pubkey={recipient}
              displayName={recipientDisplayName ?? null}
              highlighted={state === "active"}
              size="md"
            />
            <div className="min-w-0">
              <p className="break-all font-mono text-caption font-semibold text-text">
                {recipientDisplayName?.trim() || truncatePubkey(recipient)}
              </p>
              <p className="mt-1 text-caption text-muted">
                {t("contributionsProgress", {
                  received: contributionsReceived,
                  required: contributionsRequired,
                })}
              </p>
            </div>
          </div>
          <Progress value={progressValue} />
        </div>
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-border/70 bg-white p-4">
          <div className="flex flex-col gap-1">
            <span className="text-caption font-semibold uppercase tracking-wide text-muted">
              {t("deadline")}
            </span>
            <span className="font-mono text-caption text-text">{deadlineLabel}</span>
          </div>
          <Button variant={isActionable ? "primary" : "secondary"} size="md" className="w-full">
            {isActionable ? t("claim") : t("viewDetails")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
RotationCard.displayName = "RotationCard";
