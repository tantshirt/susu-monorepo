"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface TxSummaryRow {
  label: string;
  value: string;
  mono?: boolean;
}

export interface TxSummaryPanelProps {
  rows: TxSummaryRow[];
  className?: string;
}

/**
 * Molecule — labeled rows for transaction review (Atomic Design).
 */
export function TxSummaryPanel({ rows, className }: TxSummaryPanelProps) {
  const t = useTranslations("tx");
  if (rows.length === 0) return null;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-white/95 shadow-1",
        className,
      )}
    >
      <div className="border-b border-border/70 bg-surface2/70 px-5 py-4">
        <h2 className="text-caption font-semibold uppercase tracking-[0.18em] text-muted">
          {t("summaryTitle")}
        </h2>
      </div>
      <dl className="grid gap-0">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 border-b border-border/60 px-5 py-4 last:border-b-0 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-baseline sm:gap-4"
          >
            <dt className="text-caption font-medium text-muted">{row.label}</dt>
            <dd
              className={cn(
                "min-w-0 max-w-full break-all text-body font-semibold text-text sm:text-end",
                row.mono && "font-mono text-caption",
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
