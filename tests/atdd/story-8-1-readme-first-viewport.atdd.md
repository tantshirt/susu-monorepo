# ATDD: Story 8.1 — README first-viewport with badge architecture (FR52, UX-DR25)

**GH Issue:** #83
**Branch:** `story-8-1-readme-first-viewport`
**Wave:** B+ (after 8.2 + 8.3 merged)

## Scope

Rewrite the top of `README.md` so the **first viewport** (no scrolling on a 1440px display) renders the eight elements documented in UX-DR25, in order:

1. H1 (project name) with hero styling — rendered through inline SVG hero block.
2. One-line description (subhead).
3. Badge row: audit / MIT / devnet / mainnet / 10K passed / Upgrade burned / CI.
4. Copy-on-click `pnpm susu:demo` block with wall-clock subtext.
5. Watch-60s-demo CTA (TODO placeholder for Story 8.6).
6. Fork-on-github CTA.
7. Curve novelty hook line.
8. Inline static SVG curve plot (committed as `docs/assets/curve-hero.svg`).

The README must also continue to render correctly on github.com (no broken images, no horizontal scroll on mobile GitHub).

## Inputs already on main

- 8.2 (PR #210): `apps/reference/app/api/badge/adversary/route.ts` (SVG endpoint).
- 8.3 (PR #211): `apps/reference/app/api/badge/upgrade-burned/route.ts` (SVG endpoint).
- 7.11: `apps/reference/components/susu/CurveVisualizer.tsx` (static-svg variant).
- 6.10: `pnpm susu:demo` (`scripts/susu-demo.sh`).
- 5.4: `audits/adversary/adversary-report.json`.

## Out of scope

- Animated/interactive curve (Story 8.4).
- Demo video embed link (Story 8.6 — leave TODO).
- Partner reference link cluster (Stories 8.5 / 8.7).

## Acceptance scenarios

### Scenario: README first viewport contains all 8 elements in documented order

**Given** the README rewrite commit lands
**When** I read `README.md` from top to bottom
**Then** the first hero section contains the H1 hero-SVG block, then the one-line description, then the badge row, then the `pnpm susu:demo` code block with wall-clock subtext, then the watch-60s-demo CTA placeholder, then the fork-on-github CTA, then the curve novelty hook line, then the inline static curve SVG (`docs/assets/curve-hero.svg`).

### Scenario: badge URLs point to the right routes / files

**Given** the badge architecture seed work landed in 8.2 and 8.3
**When** I inspect the badge row in the README
**Then** the audit badge resolves either to a future `audits/firm-name-2026-XX.pdf` or to a documented `audit-pending` state link (e.g., `docs/legal-engagement.md` or `audit-pending` shields URL).
**And** the "10,000 adversarial circles passed" badge URL points to `/api/badge/adversary` (i.e., the URL ends with `/api/badge/adversary`).
**And** the "Upgrade authority: burned" badge URL points to `/api/badge/upgrade-burned`.
**And** the CI badge points to the `ci.yml` GitHub Actions workflow badge URL.
**And** the MIT license badge resolves to `LICENSE`.

### Scenario: copy-on-click `pnpm susu:demo` block

**Given** Story 6.10 ships `pnpm susu:demo` and the script measures wall-clock seconds
**When** I view the demo block in the README
**Then** there is a fenced code block whose content starts with `pnpm susu:demo`.
**And** the README includes wall-clock subtext text matching the pattern `demo took <seconds>s last verified at <commit-sha>` (literal `$COMMIT_SHA` placeholder is acceptable until CI replaces it).

### Scenario: inline static curve SVG asset

**Given** Story 7.11 publishes the static-svg `<CurveVisualizer />` and Story 8.4 will animate it
**When** I look up the inline curve plot
**Then** the file `docs/assets/curve-hero.svg` exists.
**And** it is a valid SVG document containing a `<polyline>` element (the curve overlay).
**And** the README references `docs/assets/curve-hero.svg`.

### Scenario: render-script artifact

**Given** the SVG was emitted by a build-time helper for forkability
**When** I look for the helper script
**Then** `scripts/render-curve-hero.mjs` exists, imports from `apps/reference/lib/curve/computeCollateralCurve.ts` (or its ported logic), and writes to `docs/assets/curve-hero.svg`.

### Scenario: README does not crash GitHub renderer

**Given** the README is rewritten
**When** I look for known GitHub-incompatible markdown
**Then** the README does not include `<script>` tags.
**And** all image references in the first viewport use either committed paths (`./docs/assets/...`, `./LICENSE`) or shields-style absolute URLs.

## Test surface

- `tests/atdd/story-8-1-readme-first-viewport.static.red.test.mjs` — node:test static assertions over `README.md`, `docs/assets/curve-hero.svg`, `scripts/render-curve-hero.mjs`.

## Caveats for downstream stories

- 8.4 (interactive curve) will replace the static SVG with an animated SMIL/CSS variant — keep the file path stable.
- 8.5/8.7 will inject the partner reference link cluster *below* the hero — this story does not delete those sections.
- 8.6 will replace the `<!-- TODO Story 8.6 -->` placeholder with a real video embed.
- Production Vercel URL will replace the `https://susu.protocol/...` placeholder once deploy lands.
