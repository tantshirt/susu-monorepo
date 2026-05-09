"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/**
 * Switch — Radix toggle. UX-DR28 focus ring; checked state surfaces the
 * cross-skin mint via `bg-signal`.
 */
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill border-2 border-transparent",
      "transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-signal data-[state=unchecked]:bg-surface2",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-pill shadow-1 ring-0",
        "transition-transform",
        // Thumb contrast: dark `--bg` on mint when checked; lighter `--text`
        // on `--surface2` when unchecked so the thumb stays visible on both
        // skins.
        "data-[state=checked]:bg-bg data-[state=unchecked]:bg-text",
        // LTR: thumb slides 5 (20px) right on checked. RTL: mirrors via
        // negative translate so the thumb tracks the trailing edge in Arabic.
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        "rtl:data-[state=checked]:-translate-x-5 rtl:data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;
