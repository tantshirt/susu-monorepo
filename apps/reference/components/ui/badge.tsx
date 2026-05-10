"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge — status pill. Used by 7.11 RotationCard status, Epic 8 invariant
 * pass/fail indicators, etc. Token colours only; the `signal` variant
 * surfaces the cross-skin success/trust color.
 */
const badgeVariants = cva(
  cn(
    "inline-flex items-center rounded-pill border px-3 py-1 text-caption font-semibold",
    "transition-colors",
  ),
  {
    variants: {
      variant: {
        default: "border-border bg-surface2 text-text",
        signal: "border-signal/20 bg-signal/10 text-primary",
        warn: "border-warn/20 bg-warn/10 text-text",
        danger: "border-danger/20 bg-danger/10 text-danger",
        outline: "border-border bg-surface text-muted",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
