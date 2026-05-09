# Story 7.17 ATDD — Mobile-first responsive layout, 360px floor + Playwright visual regression

Issue: tantshirt/susu-monorepo#81 (Epic 7 capstone)

## Acceptance criteria

**Given** the entire Epic 7 reference app (Stories 7.1–7.16, 7.18 already merged)
**When** the responsive-layout commit lands
**Then**

1. Every page renders without horizontal scroll on a 360×640 viewport (the Linh-handset floor — explicit P0 constraint).
2. The four right-aligned `<TopNav />` controls collapse into a hamburger `<DropdownMenu />` at `< md` (Tailwind 768px). `<ClusterPill />` stays always-visible per UX-DR16; only LocaleDropdown / SkinToggle / WalletStatus collapse.
3. Type sizes don't break at 360px — `text-display-1` (56/64) drops to a smaller `text-display-2` (40/48) variant via responsive utility on the home / pilot heading surfaces. A `display-2` token is added to `tailwind.config.ts` to back the responsive pair.
4. Touch targets are ≥ 44 × 44 px on every interactive primitive (WCAG 2.5.5). The `Button` component's `sm` / `md` / `lg` size variants and `icon` size all expose at least `h-11 w-11` (44px) on mobile, with desktop variants permitted to be larger.
5. The contribute and claim flows stack their card columns vertically below `md` and use logical Tailwind classes (`ms-`/`me-`/`ps-`/`pe-`) only.
6. Playwright is configured with viewports `360x640`, `768x1024`, and `1440x900` and visual snapshots of `/en` and `/ar` (LTR + RTL coverage) home + pilot routes are committed at each viewport. Dynamic content (timestamps, dev server address bar) is masked.
7. A `visual.yml` workflow runs Playwright visual regression on every PR. It uploads the diff `playwright-report/` artifact on failure. It is skipped if only doc-only paths changed (paths filter excludes `**/*.md`, `output_susu/**`, `_bmad/**`, `log/**`).
8. `apps/reference/package.json` exposes a `e2e:visual` script that maps to `playwright test --project=visual`.

## Static red contract

`tests/atdd/story-7-17-mobile-responsive.static.red.test.mjs` asserts:

- `apps/reference/playwright.config.ts` exists and pins viewports `360`, `768`, and `1440` (mobile floor + tablet + desktop).
- `apps/reference/tests/e2e/visual.spec.ts` exists and references `toHaveScreenshot`.
- `.github/workflows/visual.yml` exists, runs Playwright, uploads diff artifacts on failure, and excludes doc-only paths.
- `apps/reference/package.json` exposes a `e2e:visual` script.
- `apps/reference/components/TopNav.tsx` references the `DropdownMenu` primitive (mobile hamburger collapse) and keeps `<ClusterPill />` outside the collapsed wrapper.
- `apps/reference/components/ui/button.tsx` size variants meet the 44 × 44 floor (`h-11`/`h-12`/`h-14` and `w-11`/`size-11`/...): the file must NOT contain `h-8` / `h-10` (32 / 40 px) which are the sub-44px sizes that regressed pre-7.17.
- `apps/reference/tailwind.config.ts` exposes a `display-2` font-size token.
- The contribute and claim clients use logical Tailwind classes only and stack columns vertically below `md`.

## Out of scope

- Deep behavior tests of the modal flow (Stories 7.14 / 7.15 already cover those).
- Replacing the placeholder rotation discovery (will be tracked as a follow-up — Story 7.14 caveat).
