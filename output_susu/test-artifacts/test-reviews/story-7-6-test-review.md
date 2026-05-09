# Test Review — Story 7.6: Top nav

## Scope

- `tests/atdd/story-7-6-top-nav.atdd.md`
- `tests/atdd/story-7-6-top-nav.static.red.test.mjs` (9 assertions)

## Coverage matrix

| AC (issue #70) | Static assertion(s) |
| --- | --- |
| `TopNav.tsx` exists and renders on every route | Test #1 (file exists, server component) |
| TopNav composes ClusterPill + LocaleDropdown + SkinToggle + WalletStatus | Test #2 (all four imports present) |
| TopNav accepts a locale prop | Test #3 |
| ClusterPill always visible per UX-DR16 | Test #4 (no `return null;`); reads `NEXT_PUBLIC_CLUSTER` via `lib/env.ts`; uses Badge primitive |
| Locale dropdown lists all six locales | Test #5 (every locale code as quoted literal) |
| Native locale names | Test #6 (English, Tiếng Việt, العربية, Español, Yorùbá, Kreyòl) |
| WalletStatus placeholder + 7.9 integration marker | Test #7 ("use client", Connect string, "7.9" comment present) |
| `[locale]/layout.tsx` mounts TopNav and uses Next.js 16 Promise params | Test #8 (`params: Promise<{ locale: string }>`, `await params`) |
| Logical Tailwind classes only (RTL safe; check-patterns.sh) | Test #9 (no `pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-`) |

## Quality assessment

- **Determinism:** All assertions are pure file/regex inspections — zero process-level variability.
- **Red-then-green discipline:** Tests were authored first and confirmed failing on baseline (8/9 fail before implementation, all 9 pass after). Verified.
- **No flakes / sleeps / network:** Static tests only.
- **Surface fragility risk:** Tests assert on stable surfaces (file paths declared in the story brief, primitive imports, locale codes from `lib/i18n/config.ts`). Low risk of false positives on minor refactors.

## Gaps acknowledged (deferred)

- **Runtime rendering on `/404`:** Static tests assert structural composition; the AC of "renders on `/404`" is a Playwright concern — story 7.10 owns the e2e harness. Tracking in dependency graph.
- **Mobile collapse:** The hamburger collapse is enforced in markup via `hidden md:flex`; visual breakpoint behavior is best validated by Playwright, deferred to 7.10.
- **Privy auth states:** Out of scope per story brief — explicitly deferred to 7.9.

## Decision

GO. Static red→green pipeline verified; runtime gaps documented and routed to Playwright epic.
