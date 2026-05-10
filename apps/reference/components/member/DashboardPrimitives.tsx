import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="w-fit rounded-pill border border-text/10 bg-white/85 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
      {children}
    </span>
  );
}

export function ActionLink({
  href,
  children,
  variant = "dark",
}: {
  href: string;
  children: ReactNode;
  variant?: "dark" | "light";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-12 w-fit items-center justify-center rounded-pill px-5 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2",
        variant === "dark"
          ? "bg-text text-white shadow-2 hover:bg-text/90 focus-visible:ring-offset-bg"
          : "border border-border bg-white text-text shadow-1 hover:border-primary/40 hover:bg-surface2 focus-visible:ring-offset-white",
      )}
    >
      {children}
    </Link>
  );
}
