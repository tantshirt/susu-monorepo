# ATDD — Story 7.11: `<RotationCard />`, `<MemberAvatar />`, `<CurveVisualizer />` static-svg

## Story

> As Linh (end-saver), I want a `<RotationCard />` showing my group's roster, my position, my next action, and the curve-required collateral with a tooltip linking to a static SVG curve plot, so that the group's state is legible at a glance and the curve novelty is one tap away.

GH issue: #75. Branch: `story-7-11-rotation-card-curve-viz`. Wave I.

## Inputs

- Architecture: `output_susu/planning-artifacts/architecture.md` (search "rotation", "RotationCard", "CurveVisualizer").
- PRD: `output_susu/planning-artifacts/prd.md`.
- Curve spec: `docs/collateral-curve.md` — closed-form `C_i = c(2n - 1 - i)` (zero-indexed slot, `3 <= n <= 12`).
- Canonical Rust impl: `programs/susu/src/curve.rs`.
- Wave H baseline: 7.4 shadcn primitives, 7.6 top nav, 7.7 next-intl, 7.9 wallet hook, 7.10 modal infra.

## Acceptance criteria (red)

The static red harness `tests/atdd/story-7-11-rotation-card-curve-viz.static.red.test.mjs` asserts:

1. `apps/reference/components/susu/RotationCard.tsx` exists. Server Component (no `"use client"` directive). Exports `RotationCard`. Imports `Card` from `@/components/ui/card`. Imports `MemberAvatar`. References the `rotation` prop and renders state badge tokens for `pending`, `active`, `claimed`. Uses `useTranslations` for user-facing strings. No directional Tailwind classes. No hex colors.
2. `apps/reference/components/susu/MemberAvatar.tsx` exists. Client Component (`"use client"`). Exports `MemberAvatar`. Imports `Avatar` / `AvatarFallback` from `@/components/ui/avatar`. Accepts `pubkey` and optional `size` (`sm | md | lg`). No directional classes. No hex colors.
3. `apps/reference/components/susu/CurveVisualizer.tsx` exists. Pure SVG variant — does not contain `"use client"`. Exports `CurveVisualizer`. Renders a `<svg>` element with `role="img"` and an `aria-label`. Includes `<rect>` bar elements. No directional classes. No hex colors. No `addEventListener`, `onMouseMove`, `onClick`, slider input, or any interactive handler in the source.
4. `apps/reference/lib/curve/computeCollateralCurve.ts` exists, exports `computeCollateralCurve(n, contribution)`. Pure function — no React imports.
5. Companion unit test `apps/reference/lib/curve/computeCollateralCurve.test.ts` exists and references the canonical formula `2 * n - 1 - i`.

## Implementation notes

- `RotationCard` renders rotation index `i / n`, recipient (`<MemberAvatar />` + truncated address), state `Badge`, contribution count progress, claim deadline countdown, action button (Claim / View Details). Locale prop accepted.
- `MemberAvatar` derives a deterministic `--surface2`-tinted color and 2-char initials from `pubkey.slice(0, 4)`. Optionally calls `useGroupMetadata` / display-name hook.
- `CurveVisualizer` consumes `n`, `contribution`, optional `highlight: number[]`, `locale`. Renders an SVG axis frame and `n` bars at i = 0..n-1 with height proportional to `c(2n - 1 - i)`. `fill-primary` for normal, `fill-warn` for highlighted. Cross-skin via tokens — no per-skin branching. No JS, no animation. Animation comes in Story 8.4 — explicitly out of scope.
- `computeCollateralCurve(n, contribution)` returns `Array<number>` of length `n` using the canonical Rust closed form `C_i = contribution * (2n - 1 - i)` for `i` in `0..n`.

## Test review

Output: `output_susu/test-artifacts/test-reviews/story-7-11-test-review.md`.

## Code review

Output: `output_susu/test-artifacts/code-reviews/story-7-11-code-review.md`. Apply must-fix.

## PR

Title: `Story 7.11: RotationCard + MemberAvatar + CurveVisualizer static-svg (fixes #75)`. Body includes `Fixes #75`, AC checklist, Co-Authored-By footer.
