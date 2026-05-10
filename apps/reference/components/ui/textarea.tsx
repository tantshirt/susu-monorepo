"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Textarea — multi-line input. Same token surface as Input; UX-DR28 ring.
 */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[120px] w-full rounded-lg border border-border bg-surface px-4 py-3",
      "text-body text-text placeholder:text-muted",
      "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
