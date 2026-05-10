"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Organism — three trust markers (Atomic Design).
 */
export function TrustStrip({ className }: { className?: string }) {
  const t = useTranslations("dashboard");
  const items = [
    { key: "trustAdversary" as const, label: "01" },
    { key: "trustSimulate" as const, label: "02" },
    { key: "trustOpensource" as const, label: "03" },
  ];
  return (
    <ul
      className={cn(
        "grid gap-3 md:grid-cols-3",
        className,
      )}
    >
      {items.map(({ key, label }) => (
        <li
          key={key}
          className="flex items-center justify-center gap-3 rounded-pill bg-white px-5 py-4 shadow-1"
        >
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {label}
          </span>
          <p className="text-center text-caption font-semibold leading-snug text-text">{t(key)}</p>
        </li>
      ))}
    </ul>
  );
}
