# Story 7.1 — Next.js 15 reference app scaffold + provider order + Zod env loader

> Source: GitHub issue #65. This file mirrors the issue body so downstream BAD reviewers and the story dependency graph have a stable on-disk reference.

## User Story

As a reference-app developer, I want `apps/reference/` initialized with Next.js 15 App Router, the locked provider order (`PrivyProvider > ConvexProvider > IntlProvider`) in `app/layout.tsx`, and a Zod-validated env loader at `lib/env.ts`, so that all subsequent UX work has a coherent provider chain and missing env vars fail loudly at startup.

## Acceptance Criteria

**Given** the monorepo from Epic 1
**When** `pnpm dlx create-next-app@latest apps/reference --ts --app --tailwind --eslint --import-alias "@/*" --no-src-dir --use-pnpm` runs followed by manual provider wiring

- **AC1.** `apps/reference/app/layout.tsx` nests providers in order `PrivyProvider > ConvexProvider > IntlProvider > children`.
- **AC2.** `apps/reference/lib/env.ts` exports a Zod-validated env object covering: `NEXT_PUBLIC_HELIUS_RPC_URL`, `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_CLUSTER`, `NEXT_PUBLIC_SPHERE_ENABLED`.
- **AC3.** Missing required env vars throw with a helpful error citing `.env.example`.
- **AC4.** `apps/reference/.env.example` is committed with all required keys and dummy values.
- **AC5.** `apps/reference/README.md` documents the provider order with rationale (PrivyProvider outermost so Convex queries can read auth state).
- **AC6.** `pnpm --filter @susu/reference dev` starts the app locally without crashing when `.env.example` keys are present.
- **AC7.** `scripts/check-patterns.sh` is extended to assert no `process.env.*` reads outside `apps/reference/lib/env.ts` (with `next.config.mjs` grandfathered explicitly when present).

## Dev Notes

- **Provider order is locked.** Privy must be outermost so Convex queries can read auth state at hydration. This story does not import any `convex/*` schema yet — only the `ConvexReactClient` wrapper. The real Convex wiring lands in Story 7.13.
- **Zod env loader is the single source of truth.** Every `process.env.X` read outside `apps/reference/lib/env.ts` is a CI failure via `scripts/check-patterns.sh`. The next.config.mjs file may use `process.env` if explicitly grandfathered.
- **Source tree.** Next 15 App Router + RSC, no `src/` dir, flat layout `apps/reference/{app, components, lib, messages, public}/`.
- **Stack constraints.** ZK ElGamal disabled (2026-05); Wallet-Standard primary (Privy is a provider); no `realloc` discipline.
- **UX direction.** Phantom-fintech dark + Solana mint-green. Story 7.2 adds full token wiring; 7.1 just exposes a placeholder home page.
