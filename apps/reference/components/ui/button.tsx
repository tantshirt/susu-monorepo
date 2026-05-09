"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — UX-DR38 hierarchy: primary (mint bg + ink text, only one per
 * view), secondary (surface-2 + border), ghost (transparent), destructive
 * (danger bg), link (primary text + underline).
 *
 * Story 7.17 raised the size variants to honour the 44 × 44 px touch-target
 * floor (WCAG 2.5.5). Sizes are now sm 44 / md 48 / lg 56 / icon 44 — the
 * pre-7.17 32 / 40 / 48 px values regressed mobile usability on Linh's
 * 360px handset. Hit-area now exceeds the floor at every breakpoint.
 *
 * UX-DR28: every interactive element wires a 2px `--signal` (mint) focus ring
 * at 2px offset via `focus-visible:` so the cross-skin focus identity is
 * stable on both neutral and diaspora skins.
 *
 * Colors flow exclusively through Tailwind semantic tokens
 * (`bg-primary`, `text-bg`, `bg-surface2`, `text-text`, `border-border`,
 * `bg-danger`, …) — no hex / rgb / Tailwind-palette literals.
 */
const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md",
    "text-body font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        primary: "bg-primary text-bg hover:bg-primary/90 active:bg-primary/80",
        secondary:
          "bg-surface2 text-text border border-border hover:bg-surface hover:border-primary/40",
        ghost: "bg-transparent text-text hover:bg-surface2",
        destructive: "bg-danger text-bg hover:bg-danger/90 active:bg-danger/80",
        link: "bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Story 7.17: bumped sm 32→44, md 40→48, lg 48→56, icon 40→44 to
        // honour WCAG 2.5.5 (44×44 minimum) on mobile. The Tailwind spacing
        // scale uses 4px steps, so h-11 = 44px / h-12 = 48px / h-14 = 56px.
        sm: "h-11 px-3 text-caption",
        md: "h-12 px-4 text-body",
        lg: "h-14 px-6 text-body",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
