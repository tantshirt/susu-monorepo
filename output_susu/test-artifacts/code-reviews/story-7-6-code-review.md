# Code Review — Story 7.6: Top nav

## Files reviewed

- `apps/reference/components/TopNav.tsx`
- `apps/reference/components/nav/ClusterPill.tsx`
- `apps/reference/components/nav/LocaleDropdown.tsx`
- `apps/reference/components/nav/WalletStatus.tsx`
- `apps/reference/app/[locale]/layout.tsx`

## Adversarial passes

### Blind Hunter

- TopNav is a Server Component; only the three interactive sub-components are Client. RSC boundary is correct (no client-only APIs in TopNav itself).
- `ClusterPill` reads through `lib/env.ts` — does not bypass `scripts/check-patterns.sh` env discipline. Verified by passing `bash scripts/check-patterns.sh`.
- `LocaleDropdown` writes the next-intl cookie name (`NEXT_LOCALE`) sourced from `lib/i18n/config.ts`, so the middleware and UI cannot drift on cookie key.
- `pathWithoutLocale()` strips the leading locale segment correctly for both root (`/en` → `/`) and nested paths (`/en/groups/abc` → `/groups/abc`); falls through gracefully when the first segment isn't a locale.

### Edge Case Hunter

- `NEXT_PUBLIC_CLUSTER` enum includes `testnet` per `lib/env.ts`, but UX-DR16 only specifies mainnet/devnet/localnet color mappings. ClusterPill maps `testnet` → `warn` (same as `devnet`) so we never crash on an unmapped value. The label remains the source of truth per UX-DR16.
- `LocaleDropdown` cookie write wrapped in `try/catch`; if cookies are disabled the URL push still navigates, so locale switching degrades gracefully.
- `[locale]/layout.tsx` calls `notFound()` before `setRequestLocale`, so an unsupported locale never leaks into next-intl state.

### Acceptance Auditor

- All AC items from issue #70 mapped to either static assertions (test review) or to Playwright deferral (Story 7.10).
- The Privy integration point in `WalletStatus.tsx` is clearly marked with the literal "7.9" anchor so the next story can grep for it.

## Token / pattern compliance

- All Tailwind classes are token-driven (`bg-bg`, `border-border`, `text-text`, `text-primary`, `bg-surface2`) — no hex / named-palette literals.
- All directional axes use logical classes (`items-center`, `justify-between`, `gap-2`, `gap-3`, `px-4`, `top-0`). No `pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-` introduced. RTL flip in `ar` works without overrides.
- `scripts/check-patterns.sh`: OK.
- `pnpm --filter @susu/reference lint`: clean.
- `pnpm --filter @susu/reference build`: TypeScript Story 7.6 typing OK; the only failure is a preexisting Story 7.13 `convex/server` import bug in `apps/reference/convex/groups.ts` (unrelated to this story; tracked under Story 7.13 follow-up). The Next.js 16 `params: Promise<>` typing issue called out in the story brief is now fixed.

## Decision

GO. No must-fix items.
