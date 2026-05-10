"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — UX-DR38 hierarchy: primary (teal bg + white text, one per
 * view), secondary (white + border), outline, ghost (transparent), destructive
 * (danger bg), link (primary text + underline).
 *
 * Story 7.17 raised the size variants to honour the 44 × 44 px touch-target
 * floor (WCAG 2.5.5). Sizes are now sm 44 / md 48 / lg 56 / icon 44 — the
 * pre-7.17 32 / 40 / 48 px values regressed mobile usability on Linh's
 * 360px handset. Hit-area now exceeds the floor at every breakpoint.
 *
 * UX-DR28: every interactive element wires a 2px `--signal` focus ring
 * at 2px offset via `focus-visible:` so the cross-skin focus identity is
 * stable on both neutral and diaspora skins.
 *
 * Colors flow exclusively through Tailwind semantic tokens
 * (`bg-primary`, `bg-surface2`, `text-text`, `border-border`,
 * `bg-danger`, etc.) — no hex / rgb / Tailwind-palette literals.
 */
const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill",
    "text-body font-semibold transition-[background-color,border-color,color,box-shadow,transform]",
    "active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        primary: "border border-primary bg-primary text-white shadow-1 hover:bg-primary/90 active:bg-primary/80",
        secondary:
          "border border-border bg-surface text-text shadow-1 hover:border-primary/40 hover:bg-surface2",
        outline:
          "border border-border bg-transparent text-text hover:border-primary/40 hover:bg-surface2",
        ghost: "bg-transparent text-text hover:bg-surface2 hover:text-primary",
        destructive: "border border-danger bg-danger text-white shadow-1 hover:bg-danger/90 active:bg-danger/80",
        link: "rounded-md bg-transparent px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Story 7.17: bumped sm 32→44, md 40→48, lg 48→56, icon 40→44 to
        // honour WCAG 2.5.5 (44×44 minimum) on mobile. The Tailwind spacing
        // scale uses 4px steps, so h-11 = 44px / h-12 = 48px / h-14 = 56px.
        sm: "h-11 px-4 text-caption",
        md: "h-12 px-5 text-body",
        lg: "h-14 px-7 text-body",
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
