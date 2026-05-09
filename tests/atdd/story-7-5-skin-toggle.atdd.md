# ATDD — Story 7.5: `<SkinToggle />` with cookie + localStorage persistence + server-side hydration

GH Issue: #69
Story spec: `output_susu/planning-artifacts/epics.md` § "Story 7.5"

## Acceptance Criteria mapping

| AC | Description | Static-test assertion |
|----|-------------|------------------------|
| AC1 | `<SkinToggle />` Client Component lives at `apps/reference/components/SkinToggle.tsx` and toggles `data-skin` between `"neutral"` and `"diaspora"` | File-existence + `"use client"` directive + reference to `data-skin` and both literal skin names |
| AC2 | Toggle persists state via cookie (`susu-skin`) and `localStorage` (`susu-skin`) | Source contains both `document.cookie` and `localStorage` references with the `susu-skin` key |
| AC3 | Cookie attributes match SSR-readable defaults: `Path=/`, `Max-Age=31536000`, `SameSite=Lax` | Source contains `Path=/`, `Max-Age=31536000`, and `SameSite=Lax` literals |
| AC4 | Server-side helper at `apps/reference/lib/theme/skin.ts` exports `getServerSkin()` reading `next/headers cookies()` | File exists + exports `getServerSkin` + imports from `next/headers` + references `susu-skin` |
| AC5 | Root `app/layout.tsx` reads `getServerSkin()` and renders `<html data-skin={...}>` so the first paint matches the persisted skin (no FOUC) | `app/layout.tsx` imports `getServerSkin` and the literal `data-skin={` interpolation appears |
| AC6 | A pre-hydration inline script at the top of `<body>` reads `localStorage` synchronously and reconciles `data-skin` before React hydrates | `app/layout.tsx` contains a `dangerouslySetInnerHTML` block referencing `localStorage` and `susu-skin` |
| AC7 | Toggle uses the shadcn `Button` primitive from Story 7.4 | `SkinToggle.tsx` imports `Button` from `@/components/ui/button` |

## Files to create

- `apps/reference/components/SkinToggle.tsx`
- `apps/reference/lib/theme/skin.ts`
- (modify) `apps/reference/app/layout.tsx`

## Out of scope

- Playwright runtime tests (covered by later e2e story).
- Zustand store mirror (`lib/stores/skin.ts`) — deferred; cookie + localStorage are the SSR-readable source of truth and adequate for AC coverage.
- Animated thumb / `role="radiogroup"` UI polish — handled in a follow-up UX pass; this story scopes to persistence + SSR hydration.
