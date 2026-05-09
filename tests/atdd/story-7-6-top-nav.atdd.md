# ATDD — Story 7.6: Top nav with always-visible `<ClusterPill />` + locale dropdown + skin toggle + wallet status

## Acceptance criteria (from issue #70)

- `components/TopNav.tsx` renders on every reference-app route including `/404`.
- `<ClusterPill />` shows `devnet`, `mainnet-beta`, `localnet`, or `testnet` per UX-DR16; the *label* is the source of truth, not the color.
- The locale dropdown lists all 6 locales (`en`, `vi`, `ar`, `es`, `yo`, `ht-kreyol`) with native names.
- The wallet status placeholder is rendered as a "Connect" stub (Privy wiring deferred to 7.9).
- On mobile (<768px), non-cluster items collapse into a hamburger menu; the ClusterPill remains visible at all times.

## Static (red) assertions

The companion `story-7-6-top-nav.static.red.test.mjs` enforces:

1. `apps/reference/components/TopNav.tsx` exists and is a Server Component (no `"use client"` directive).
2. `TopNav.tsx` imports `ClusterPill`, `LocaleDropdown`, `SkinToggle`, and `WalletStatus`.
3. `apps/reference/components/nav/ClusterPill.tsx` exists, reads from `lib/env.ts`, uses `Badge` from shadcn, and is **always rendered** (no conditional return null).
4. `apps/reference/components/nav/LocaleDropdown.tsx` exists, declares `"use client"`, uses `DropdownMenu` from shadcn, and lists all six locale codes.
5. `apps/reference/components/nav/WalletStatus.tsx` exists, declares `"use client"`, renders a placeholder `Connect` button, and contains a code comment marking the Privy integration point for Story 7.9.
6. `apps/reference/app/[locale]/layout.tsx` renders `<TopNav locale={...} />` and uses the Next.js 16 `params: Promise<>` await pattern.
7. No directional Tailwind classes (`right-`, `left-`, `pl-`, `pr-`, `ml-`, `mr-`) anywhere in the new top-nav files — logical (`start-`, `end-`, `ps-`, `pe-`, `ms-`, `me-`) only.
