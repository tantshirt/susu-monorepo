# Story 7.1 Test Review

## Scope

- `tests/atdd/story-7-1-next-app-scaffold.atdd.md`
- `tests/atdd/story-7-1-next-app-scaffold.static.red.test.mjs`
- `apps/reference/app/layout.tsx`
- `apps/reference/app/providers/{PrivyProviderWrapper,ConvexProviderWrapper,IntlProviderWrapper}.tsx`
- `apps/reference/lib/env.ts`
- `apps/reference/.env.example`
- `apps/reference/README.md`
- `scripts/check-patterns.sh`

## AC ↔ Test traceability

| AC | Test | Notes |
|----|------|-------|
| AC1 — provider order in layout | `Story 7.1 layout.tsx nests PrivyProvider > ConvexProvider > IntlProvider > children` | Asserts each wrapper appears as a JSX element AND that opening-tag indices satisfy `privy < convex < intl`, which catches reorderings even if all three remain present. |
| AC1 (clarifier) — wrappers are client components, no convex schema yet | `Story 7.1 each provider wrapper is a client component and ConvexProviderWrapper does not import convex schema` | `"use client"` regex anchored to start of file; explicit negative match for `convex/_generated`. |
| AC2 — Zod schema covers all six keys | `Story 7.1 lib/env.ts is a Zod schema covering all six required keys with helpful error citing .env.example` | Iterates over every required key and asserts each is referenced in `lib/env.ts`. |
| AC3 — helpful error citing `.env.example` | Same as AC2 — regex `/\.env\.example/` anchored. Runtime trigger is exercised indirectly through `next build`, which loads `lib/env.ts` and would throw on missing keys. |
| AC4 — `.env.example` checked in with all keys | `Story 7.1 commits .env.example with every required key and dummy values` | Each key matched as `^KEY=` line. |
| AC5 — README documents provider order with rationale | `Story 7.1 README documents provider order with auth-hydration rationale` | Asserts mention of all three providers + `/auth/i` for the hydration rationale. |
| AC6 — `pnpm dev` boots | Out-of-band smoke check via `next build` against `.env.example` values during implementation. Adding a runtime CI smoke is deferred to Story 7.13 (which actually wires Convex) to avoid burning Privy app-id credentials in CI. |
| AC7 — `check-patterns.sh` forbids `process.env` outside `apps/reference/lib/env.ts` | `Story 7.1 check-patterns.sh forbids process.env outside apps/reference/lib/env.ts` | Asserts the script contains both the `process.env` regex and the exemption path, then runs the script and asserts exit 0. |

Every AC has at least one static assertion. AC6 is exercised manually because a CI runtime smoke would require either secret Privy credentials or Privy SSR-disable scaffolding that belongs to a later story.

## Test isolation

The test file performs only filesystem reads and one bounded `spawnSync('bash', [checkPatternsPath])` call that runs the deterministic shell linter against the working tree. No global mutable state, no network, no fixtures shared between tests. Each `test(...)` block re-reads files independently.

## Determinism

- All assertions are pure file content matchers or direct exec of `check-patterns.sh`, which itself only greps the tree.
- No timing-sensitive assertions, no random fixtures.
- Re-runs back-to-back (`node --test ... ; node --test ...`) returned identical pass output during implementation.

## Gaps and follow-ups

1. **No runtime-error assertion for `lib/env.ts`.** The current test only asserts the schema mentions `.env.example`; it does not import `lib/env.ts` with a synthetic missing-env to verify the actual `Error` is thrown. Reason: importing `.ts` from a `node --test`-driven `.mjs` file requires either `tsx` or a transpile step, and the BAD ATDD baseline has been pure ESM. A runtime test could be added once the project formalizes a `tsx`-backed test runner.
2. **Provider order detection is positional, not structural.** The opening-tag-index heuristic fails to detect (rare) layouts that conditionally render one wrapper. A structural AST check (via TypeScript compiler API or `recast`) would be more robust but is out of scope for a static red test.
3. **No assertion on `.env.example` value plausibility.** Privy validates app-id length (25 chars) at SSR; if a later edit shortens the dummy, the next build will break but the static test will still pass. A numeric length assertion could be added if this becomes a recurring failure mode.

## Result

Approved. Tests give precise, deterministic, isolated coverage of each AC at the static level, with documented runtime-coverage gaps that are appropriately deferred to dependent stories.
