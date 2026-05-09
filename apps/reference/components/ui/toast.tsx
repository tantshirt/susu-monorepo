"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Toast — minimal token-driven toast component. Stories 7.10/7.14/7.15 will
 * compose this with a viewport + provider; here we ship the surface itself
 * so all consumers share token-driven styling.
 */
const toastVariants = cva(
  cn(
    "pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-md border p-4 shadow-2",
    "transition-all",
  ),
  {
    variants: {
      variant: {
        default: "border-border bg-surface text-text",
        signal: "border-signal bg-surface text-text",
        warn: "border-warn bg-surface text-text",
        danger: "border-danger bg-surface text-text",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  ),
);
Toast.displayName = "Toast";

export const ToastTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-body font-semibold text-text", className)} {...props} />
  ),
);
ToastTitle.displayName = "ToastTitle";

export const ToastDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-caption text-muted", className)} {...props} />
  ),
);
ToastDescription.displayName = "ToastDescription";

export { toastVariants };
