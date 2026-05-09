"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * FieldError — inline form-error message (UX-DR23). Renders in `--danger`
 * color at the `--caption` typography size, with `role="alert"` and an
 * optional `id` so the paired form input can wire `aria-describedby={id}`
 * for assistive technology.
 *
 * Token discipline: `text-danger` + `text-caption` only — no hardcoded
 * colors, no Tailwind palette literals.
 */
export interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  id?: string;
  children: React.ReactNode;
}

export const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ id, children, className, ...props }, ref) => {
    if (children == null || children === false) {
      return null;
    }
    return (
      <p
        ref={ref}
        id={id}
        role="alert"
        aria-live="polite"
        className={cn("text-caption text-danger", className)}
        {...props}
      >
        {children}
      </p>
    );
  },
);
FieldError.displayName = "FieldError";
