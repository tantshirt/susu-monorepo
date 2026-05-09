"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";

/**
 * Checkbox — Radix wrapper. UX-DR28 focus ring; `data-state=checked` paints
 * `--signal` mint as the cross-skin protocol identity.
 */
export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-border bg-surface",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-signal data-[state=checked]:text-bg data-[state=checked]:border-signal",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-bg">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="h-3 w-3"
        aria-hidden
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
