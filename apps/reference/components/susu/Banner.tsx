"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Banner — degraded-state / informational surface (UX-DR22). Renders in
 * `--warn` (RPC fallback, audit pending, on devnet), `--danger` (hard
 * errors), `--signal` (success), or `--surface2` (info) per skin tokens.
 *
 * Optional dismiss affordance — when `dismissible` is true and `onDismiss`
 * is supplied, the banner exposes a close button that calls back so the
 * parent can hide it. Token-only colors; no hardcoded literals.
 */
const bannerVariants = cva(
  cn(
    "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-body shadow-1",
    "transition-colors",
  ),
  {
    variants: {
      variant: {
        info: "border-border/80 bg-surface text-text",
        warn: "border-warn/20 bg-warn/10 text-text",
        danger: "border-danger/20 bg-danger/10 text-danger",
        success: "border-signal/20 bg-signal/10 text-primary",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

export interface BannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof bannerVariants> {
  variant: "info" | "warn" | "danger" | "success";
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  ({ variant, children, dismissible, onDismiss, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role={variant === "danger" ? "alert" : "status"}
        aria-live={variant === "danger" ? "assertive" : "polite"}
        className={cn(bannerVariants({ variant }), className)}
        {...props}
      >
        <div className="flex-1">{children}</div>
        {dismissible && onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className={cn(
              "shrink-0 rounded-sm px-2 py-1 text-caption font-medium",
              "hover:bg-bg/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
            )}
          >
            Dismiss
          </button>
        ) : null}
      </div>
    );
  },
);
Banner.displayName = "Banner";

export { bannerVariants };
