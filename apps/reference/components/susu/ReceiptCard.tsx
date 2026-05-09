"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

/**
 * ReceiptCard — permanent transaction receipt (UX-DR21, UX-DR39). Receipts
 * never get replaced by toasts; once a tx confirms, a `<ReceiptCard />`
 * renders inline as a persistent surface with the explorer link, amount,
 * timestamp, status pill, and (optionally) "what's next" guidance.
 *
 * The cluster comes exclusively from `env.NEXT_PUBLIC_CLUSTER` (parsed by
 * `lib/env.ts`, the single allowed `process.env` reader). No hardcoded
 * cluster strings or explorer URLs.
 *
 * Used by Stories 7.14 (Cycle flow) and 7.15 (Pay flow).
 */
export type ReceiptStatus = "confirmed" | "pending" | "failed";

export interface ReceiptCardProps extends React.HTMLAttributes<HTMLDivElement> {
  signature: string;
  amount?: string;
  /** ISO 8601 timestamp string. */
  timestamp?: string;
  status?: ReceiptStatus;
  /** Optional "what's next" guidance text rendered under the receipt body. */
  nextSteps?: React.ReactNode;
  /** Override the card title (defaults to "Transaction receipt"). */
  title?: string;
}

function explorerUrl(signature: string): string {
  // `env.NEXT_PUBLIC_CLUSTER` is one of mainnet-beta | devnet | testnet | localnet.
  const cluster = env.NEXT_PUBLIC_CLUSTER;
  const base = "https://explorer.solana.com/tx";
  if (cluster === "mainnet-beta") {
    return `${base}/${signature}`;
  }
  // localnet → custom cluster pointing at localhost RPC; explorer still
  // accepts an arbitrary `customUrl` query but devs typically don't open it,
  // so we degrade to the cluster query so the link remains shaped correctly.
  return `${base}/${signature}?cluster=${cluster}`;
}

function statusVariant(status: ReceiptStatus): "signal" | "warn" | "danger" {
  if (status === "confirmed") return "signal";
  if (status === "pending") return "warn";
  return "danger";
}

function statusLabel(status: ReceiptStatus): string {
  if (status === "confirmed") return "Confirmed";
  if (status === "pending") return "Pending";
  return "Failed";
}

export const ReceiptCard = React.forwardRef<HTMLDivElement, ReceiptCardProps>(
  (
    {
      signature,
      amount,
      timestamp,
      status = "confirmed",
      nextSteps,
      title = "Transaction receipt",
      className,
      ...props
    },
    ref,
  ) => {
    const url = explorerUrl(signature);
    return (
      <Card ref={ref} className={cn("w-full", className)} {...props}>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{title}</CardTitle>
            <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>
          </div>
          {amount ? (
            <CardDescription className="font-mono numeric">{amount}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted">Signature</span>
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className="break-all font-mono text-caption text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {signature}
            </a>
          </div>
          {timestamp ? (
            <div className="flex flex-col gap-1">
              <span className="text-caption text-muted">Timestamp</span>
              <span className="font-mono text-caption text-text">{timestamp}</span>
            </div>
          ) : null}
          {nextSteps ? (
            <div className="mt-2 border-t border-border pt-3 text-body text-muted">
              {nextSteps}
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  },
);
ReceiptCard.displayName = "ReceiptCard";
