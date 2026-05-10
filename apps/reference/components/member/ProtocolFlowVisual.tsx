"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ProtocolFlowVisualProps {
  className?: string;
}

/**
 * One diagram explaining lifecycle: circle → contribute → rotate → payout with receipt.
 */
export function ProtocolFlowVisual({ className }: ProtocolFlowVisualProps) {
  const t = useTranslations("dashboard");

  const labels = [
    t("protocolStepCircle"),
    t("protocolStepInvite"),
    t("protocolStepContribute"),
    t("protocolStepRotate"),
    t("protocolStepClaim"),
  ] as const;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-surface shadow-1",
        className,
      )}
      data-component="ProtocolFlowVisual"
      aria-labelledby="protocol-flow-heading"
    >
      <span id="protocol-flow-heading" className="sr-only">
        {t("protocolFlowAriaLabel")}
      </span>

      <div className="hidden p-8 md:block">
        <div
          className="mx-auto aspect-[16/10] max-h-[300px] w-full rounded-xl border border-border/70 bg-cover bg-center shadow-1"
          style={{ backgroundImage: "url(/susu-lifecycle-diagram.png)" }}
          aria-hidden
        />
        <ol className="mt-5 grid grid-cols-5 gap-2 text-center">
          {labels.map((label, i) => (
            <li
              key={i}
              data-protocol-step={i}
              data-protocol-node={i}
              className="text-caption font-semibold leading-snug text-text"
            >
              {label}
            </li>
          ))}
        </ol>
      </div>

      {/* Mobile: vertical timeline */}
      <ol className="divide-y divide-border p-6 md:hidden">
        {labels.map((label, i) => (
          <li
            key={i}
            data-protocol-step={i}
            className="flex gap-4 py-4 first:pt-0 last:pb-0"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-text bg-surface2 font-mono text-caption font-bold text-text">
              {i + 1}
            </span>
            <span className="pt-1 text-body font-semibold leading-snug text-text">{label}</span>
          </li>
        ))}
      </ol>

      <div
        className="border-t border-border bg-surface2/80 px-6 py-4 text-center"
        data-protocol-pool
      >
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">
          {t("protocolPoolCaption")}
        </p>
        <p className="mt-1 text-body font-medium text-text">{t("protocolPoolBody")}</p>
      </div>
    </div>
  );
}
