# Test Review — Story 7.18: Accessibility surface

## Scope

- `tests/atdd/story-7-18-accessibility.atdd.md`
- `tests/atdd/story-7-18-accessibility.static.red.test.mjs` (6 assertions)

## Coverage matrix

| AC (issue #82) | Static assertion(s) |
| --- | --- |
| Reduced-motion helper is server-safe and reads the media query | Test #1 (`prefersReducedMotion` export, `typeof window === "undefined"` guard, `matchMedia`, query string) |
| `globals.css` neutralises `transition-*` / `animation-*` under `prefers-reduced-motion: reduce` inside `@layer utilities` (UX-DR32) | Test #2 (`@layer utilities` containing `@media (prefers-reduced-motion: reduce)` with both `animation-*` and `transition-*` properties) |
| axe-core CI runs on `/en`, `/vi`, `/ar` with `wcag2aa,wcag21aa` tags (UX-DR27) | Test #3 (workflow file exists, axe invocation, three locale paths, both tag names) |
| Pilot page exists, is non-crypto, demonstrates Banner + FieldError + shadcn primitives (UX-DR49) | Test #4 (file exists, no Privy/Convex/wallet imports, Banner + FieldError + Button imports, no hex/rgb/hsl, no `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-`) |
| `apps/reference/package.json` lists `@axe-core/cli` | Test #5 |
| Root `package.json` exposes `a11y:check` | Test #6 |

## Quality assessment

- **Determinism:** All assertions are pure file/regex inspections — zero process-level variability.
- **Red-then-green discipline:** Tests authored first and confirmed failing on baseline (6/6 fail before implementation, 6/6 pass after).
- **No flakes / sleeps / network:** Static tests only. The runtime axe scan is wired to GitHub Actions (`a11y.yml`) and intentionally lives outside the unit harness.
- **Token discipline coverage:** Pilot page is asserted free of hex/rgb/hsl literals and directional Tailwind utilities so RTL behavior holds (UX-DR2, UX-DR33).

## Gaps acknowledged (deferred)

- **Runtime axe-core results:** Static tests verify the CI workflow exists; actual violation reports surface in the `a11y axe-core` GitHub Actions job. By design — runtime a11y is a CI concern, not a unit-test concern.
- **3-user pilot run:** The non-crypto pilot session with Vietnamese/Arabic/English speakers is an operational artifact (logged under `/log/`), not something static tests can enforce. The pilot *page* is in scope here; the *session* is owned by submission-prep.
- **Convex build bug (Story 7.13 follow-up):** The a11y workflow runs `next dev` instead of `next build` because of a known import bug in `apps/reference/convex/groups.ts`. Documented inline in the workflow; tracked separately.
- **Non-crypto rule for the pilot page:** Static test guards against `@privy-io`, `convex`, `@solana/`, and `@/lib/wallet` imports — not a generic dependency-tree scan, but it covers the realistic ways a future contributor might inadvertently couple the pilot page to crypto plumbing.

## Decision

GO. Static red→green pipeline verified; runtime axe coverage routed to CI; operational pilot deferred to submission-prep log entries.
