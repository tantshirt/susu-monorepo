"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge — status pill. Used by 7.11 RotationCard status, Epic 8 invariant
 * pass/fail indicators, etc. Token colours only; the `signal` variant
 * surfaces the cross-skin protocol-identity mint.
 */
const badgeVariants = cva(
  cn(
    "inline-flex items-center rounded-pill border px-2.5 py-0.5 text-caption font-semibold",
    "transition-colors",
  ),
  {
    variants: {
      variant: {
        default: "border-border bg-surface2 text-text",
        signal: "border-transparent bg-signal text-bg",
        warn: "border-transparent bg-warn text-bg",
        danger: "border-transparent bg-danger text-bg",
        outline: "border-border bg-transparent text-text",
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
