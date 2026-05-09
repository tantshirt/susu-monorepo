# Story 7.18 — Accessibility surface: WCAG 2.1 AA + RTL + reduced-motion + axe-core CI + non-crypto pilot

## Acceptance criteria (from #82)

1. Reduced-motion helper exists at `apps/reference/lib/a11y/reduced-motion.ts`
   exposing a `prefersReducedMotion()` boolean (server-safe — guards `window`
   and `matchMedia`). UX-DR32.
2. `apps/reference/app/globals.css` includes a global
   `@media (prefers-reduced-motion: reduce)` block under `@layer utilities`
   that disables `transition-*` / `animation-*` utilities so every existing
   component respects the OS-level setting without further changes (UX-DR32).
3. `.github/workflows/a11y.yml` exists and runs `@axe-core/cli` against `/en`,
   `/vi`, and `/ar` with failure on any `wcag2aa` / `wcag21aa` violation
   (UX-DR27).
4. Non-crypto pilot page exists at
   `apps/reference/app/[locale]/pilot/page.tsx` — renders a simple non-crypto
   form (name + goal) using `<Banner>`, `<FieldError>`, shadcn `<Button>`,
   `<Input>`, and `<Label>` for stakeholder demos and a11y validation.
5. `apps/reference/package.json` lists `@axe-core/cli` as a dev dep.
6. Root `package.json` exposes an `a11y:check` script.
7. No hardcoded color literals or directional Tailwind utilities
   (`ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-`) in any new files; logical
   properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) only (UX-DR33).
8. Pilot page must NOT import any wallet / Privy / Convex modules — pilot
   is intentionally non-crypto so testers without wallets can complete the
   flow.

## Red-phase scope

These static assertions cover existence + import-shape; runtime axe-core
runs in CI (a11y workflow), not in unit tests.
