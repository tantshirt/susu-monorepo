import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Susu reference app — class-name merge helper.
 *
 * Combines `clsx` (conditional class composition) with `tailwind-merge`
 * (deduplicate conflicting Tailwind utilities, last-wins). Every shadcn-style
 * primitive in `apps/reference/components/ui/` consumes this so variant +
 * caller `className` overrides resolve cleanly.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
