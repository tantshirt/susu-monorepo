"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton — loading placeholder. Token-only surfaces (`--surface2`) so the
 * shimmer respects whichever skin is active.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-surface2", className)}
      aria-busy="true"
      aria-live="polite"
      {...props}
    />
  );
}
