# Code Review — Story 7.18: Accessibility surface

## Files reviewed

- `apps/reference/lib/a11y/reduced-motion.ts`
- `apps/reference/app/globals.css`
- `apps/reference/app/[locale]/pilot/page.tsx`
- `.github/workflows/a11y.yml`
- `apps/reference/package.json` (dev-dep delta)
- `package.json` (root, `a11y:check` script)

## Adversarial passes

### Blind Hunter

- `prefersReducedMotion()` guards both `typeof window === "undefined"` and `typeof window.matchMedia !== "function"` so SSR and exotic non-DOM hosts (e.g., `next-intl` server-render path) cannot crash. Returns `false` on the server side — components must re-evaluate on mount via `useEffect` if they care about CSR/SSR divergence; this is documented in the JSDoc.
- The CSS reduced-motion block lives inside `@layer utilities` so it lands after Tailwind's utility layer; `!important` on every property guarantees it beats both inline styles and arbitrary-value utilities. `scroll-behavior: auto` is also reset so smooth-scroll handlers respect the OS preference.
- The pilot page is a Client Component (`"use client";`) because it owns React state. It does not import `next-intl/server`, Privy, Convex, or any wallet-adjacent module — verified by static test #4 plus a manual grep.
- The a11y workflow seeds `apps/reference/.env.local` from `.env.example` only when the example file exists, so the job degrades cleanly if the example file is moved.

### Edge Case Hunter

- The pilot page form intentionally uses `noValidate` so the FieldError component (with `role="alert"`) wins over the browser's native validation balloon — keeps the a11y surface deterministic across browsers and lets axe-core observe the alert role.
- `aria-describedby` is conditionally wired (`undefined` when no error) so we don't surface a stale `id` reference to AT.
- `aria-invalid` flips with `Boolean(error)` so screen readers announce the field as invalid as soon as `touched` is set.
- The Reset button does NOT submit — `type="button"` is explicit so a stray Enter keypress doesn't trigger validation while the user is clearing the form.
- The reduced-motion media query covers `*::before` and `*::after`, so pseudo-element animations (e.g., spinner trails on a future loading indicator) inherit the override.

### Acceptance Auditor

- AC items from issue #82 covered in scope:
  - Reduced-motion handling (UX-DR32): helper + global CSS — yes.
  - axe-core CI on every PR (UX-DR27): `.github/workflows/a11y.yml` — yes.
  - RTL via existing `[locale]` layout: this story doesn't change the layout; relies on Story 7.7's `dir` flip and asserts the workflow scans `/ar`.
  - Non-crypto pilot surface (UX-DR49): `/[locale]/pilot/page.tsx` — yes.
- AC items deferred (out of scope per story brief):
  - Skip-to-content link, focus-rings, ARIA live regions — these were already wired by Stories 7.4 (shadcn primitives have `focus-visible:` rings) and 7.12 (Banner has `role=alert`). The story brief explicitly scopes 7.18 to the *additive* a11y surface (reduced-motion + axe CI + pilot) and routes the per-component focus/skip work to the components that own them.
  - Documented contrast ratios at `docs/accessibility-contrast.md`: not in the story brief's red-test scope. Tracked as a docs follow-up.
  - 3-user pilot session: operational, logged under `/log/`.

## Token / pattern compliance

- New files contain no hex / `rgb()` / `hsl()` literals (asserted by static test #4 for the pilot page; the reduced-motion helper has no styling).
- New files use no `ml-` / `mr-` / `pl-` / `pr-` / `left-` / `right-` utilities. `bash scripts/check-patterns.sh`: OK (re-run, clean).
- All pilot page styling rides semantic tokens (`text-text`, `text-muted`, `text-h2`).
- `@layer utilities { ... }` block in globals.css does not introduce any tokens — it only neutralises motion utilities, which is the documented behavior.

## Build / lint

- `node --test tests/atdd/story-7-18-accessibility.static.red.test.mjs`: 6/6 pass.
- `pnpm --filter @susu/reference build`: not re-attempted in this PR — known Story 7.13 convex import bug still blocks `next build`. The a11y workflow runs against `next dev` instead, with a TODO comment documenting the substitution.
- `bash scripts/check-patterns.sh`: OK.

## Decision

GO. No must-fix items.
