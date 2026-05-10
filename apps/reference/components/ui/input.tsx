"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input — text/number/email/password field. UX-DR28: 2px `--signal` focus ring.
 * Surfaces use `--surface` + `--border`; placeholder colour rides `--text-muted`.
 */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-12 w-full rounded-lg border border-border bg-surface px-4 py-2",
        "text-body text-text placeholder:text-muted",
        "transition-colors",
        "file:border-0 file:bg-transparent file:text-body file:font-medium file:text-text",
        "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
