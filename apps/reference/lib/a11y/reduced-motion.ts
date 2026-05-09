/**
 * Reduced-motion helper (Story 7.18, UX-DR32).
 *
 * Reads the user's `prefers-reduced-motion: reduce` media query and returns
 * a boolean. Server-and-client safe: when called during SSR (no `window`),
 * returns `false` so the initial render matches the most permissive state;
 * components should re-evaluate on mount via `useEffect` if they need to
 * switch behavior between SSR and CSR.
 *
 * Usage pattern (client component with motion):
 *
 * ```tsx
 * "use client";
 * import { useEffect, useState } from "react";
 * import { prefersReducedMotion } from "@/lib/a11y/reduced-motion";
 *
 * export function FancyThing() {
 *   const [reduced, setReduced] = useState(false);
 *   useEffect(() => setReduced(prefersReducedMotion()), []);
 *   return reduced ? <Static /> : <Animated />;
 * }
 * ```
 *
 * For pure-CSS animations the global `@media (prefers-reduced-motion: reduce)`
 * block in `app/globals.css` already neutralizes Tailwind `transition-*`
 * and `animation-*` utilities — components only need this helper when they
 * orchestrate motion in JS (e.g., requestAnimationFrame loops, framer-motion).
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
