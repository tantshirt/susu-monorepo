# ATDD: Story 8.4 — Inline animated SVG curve plot + `<CurveVisualizer />` interactive variant (UX-DR12, FR52)

**GH Issue:** #86
**Branch:** `story-8-4-curve-svg-plot`
**Wave:** C (after 8.1 merged)

## Scope

Replace the README's static curve hero (`docs/assets/curve-hero.svg`) with a JS-free animated variant (SMIL or CSS `@keyframes`), and extend `<CurveVisualizer />` with an `interactive` prop that surfaces parameter sliders for `n` (3..12) and `contribution` ($10..$10,000), plus a "30% Cartel" toggle that highlights positions 4..6 in coral. Mount the interactive variant under `app/[locale]/docs/curve/page.tsx` and cover the interactions with Playwright (sliders, cartel toggle, reduced-motion fallback).

## Inputs already on main

- 7.11: `apps/reference/components/susu/CurveVisualizer.tsx` (static-svg variant) and `apps/reference/lib/curve/computeCollateralCurve.ts`.
- 8.1 (PR #212): `docs/assets/curve-hero.svg` committed; `scripts/render-curve-hero.mjs`; HTML-comment sentinels in README.

## Out of scope

- Replacing the README hero markdown structure (Story 8.5 owns the link cluster below the hero).
- Demo-video embed (Story 8.6).

## Acceptance scenarios

### Scenario: README curve SVG is animated (no JS, no `<script>`)

**Given** the animated commit lands
**When** I read `docs/assets/curve-hero.svg`
**Then** the file contains either a SMIL `<animate>` element or a CSS `@keyframes` rule (so the curve "draws in" smoothly).
**And** the file contains no `<script>` tag (GitHub strips them).
**And** the file honors `prefers-reduced-motion: reduce` so reduced-motion environments see the static state.

### Scenario: render-curve-hero supports a `--no-animation` static-only flag

**Given** forks may want a still image
**When** I read `scripts/render-curve-hero.mjs`
**Then** the script accepts a `--no-animation` flag and emits a still image when set.

### Scenario: `<CurveVisualizer />` exposes an interactive variant

**Given** the interactive commit lands
**When** I read `apps/reference/components/susu/CurveVisualizer.tsx`
**Then** the file declares an `interactive` prop on `CurveVisualizerProps`.
**And** the file imports React state hooks (e.g., `useState`) and ships a `"use client"` directive (interactive variant runs in the browser).
**And** the file contains an `<input type="range"` (or shadcn `Slider`) for the `n` parameter.
**And** the file contains an `<input type="range"` (or shadcn `Slider`) for the `contribution` parameter.
**And** the file contains a "30% Cartel" toggle (Switch / button / checkbox) that highlights positions 4..6 inclusive.
**And** the file contains a labeled callout describing the cartel highlight.

### Scenario: docs/curve route renders the interactive variant

**Given** the interactive variant is in place
**When** I look up `apps/reference/app/[locale]/docs/curve/page.tsx`
**Then** the file exists.
**And** the file imports and renders `<CurveVisualizer />` with `interactive` enabled.
**And** the file uses `useTranslations` (or `getTranslations`) so the page copy is localized.

### Scenario: locale message keys exist in all six locales

**Given** the docs/curve page surfaces user-facing copy
**When** I read each `apps/reference/messages/{en,vi,ar,es,yo,ht-kreyol}.json`
**Then** every locale file declares a `docs.curve.title` key.
**And** every locale file declares `docs.curve.sliderN`, `docs.curve.sliderContribution`, `docs.curve.cartelToggle`, and `docs.curve.cartelCallout` keys.

### Scenario: Playwright spec covers slider, cartel toggle, reduced-motion

**Given** the docs/curve route is live
**When** I look for the e2e spec
**Then** `apps/reference/tests/e2e/curve-interactive.spec.ts` exists.
**And** the spec exercises slider interactions for `n` and `contribution`.
**And** the spec toggles the "30% Cartel" highlight.
**And** the spec asserts a reduced-motion fallback (no transition animations under `prefers-reduced-motion: reduce`).

## Test surface

- `tests/atdd/story-8-4-curve-svg-plot.static.red.test.mjs` — node:test static assertions over the animated SVG, the React component, the docs page, the message files, and the Playwright spec.

## Caveats for downstream stories

- 8.5 (link cluster) renders below the hero — keep the `docs/assets/curve-hero.svg` path stable and do not edit the README hero markdown.
- 8.6 (video embed) may demo the interactive variant.
