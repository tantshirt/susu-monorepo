# Story 7.1 ATDD: Next.js 15 reference app scaffold + provider order + Zod env loader

## Scenario 1: Next.js 15 App Router scaffold lands at `apps/reference`

Given the monorepo from Epic 1
When the developer scaffolds the reference app via `create-next-app@latest`
Then `apps/reference/package.json` declares the Next.js 15 dependency and the workspace name `@susu/reference`
And `apps/reference/app/layout.tsx`, `apps/reference/app/page.tsx`, and `apps/reference/tsconfig.json` exist
And the project does NOT use the legacy `src/` directory layout (flat `apps/reference/{app, components, lib, messages, public}/`).

## Scenario 2: Provider order is locked PrivyProvider > ConvexProvider > IntlProvider > children

Given the reference app's `app/layout.tsx`
When the file is parsed
Then it composes wrappers in order `PrivyProviderWrapper > ConvexProviderWrapper > IntlProviderWrapper > {children}`
And each wrapper file under `apps/reference/app/providers/` is marked with the `"use client"` directive
And the ConvexProviderWrapper consumes `ConvexReactClient` from `convex/react` but does NOT yet import `convex/_generated` or schema (deferred to Story 7.13).

## Scenario 3: Zod env loader is the single source of truth

Given `apps/reference/lib/env.ts`
When the module loads
Then it parses `process.env` once via a Zod schema covering `NEXT_PUBLIC_HELIUS_RPC_URL`, `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_CLUSTER`, `NEXT_PUBLIC_SPHERE_ENABLED`
And missing required keys raise an error citing `.env.example`
And the module exports a typed `env` object.

## Scenario 4: `.env.example` and README provider-order rationale committed

Given the developer needs to bootstrap a local environment
Then `apps/reference/.env.example` ships with all six required keys and dummy values
And `apps/reference/README.md` documents the provider order with the rationale "PrivyProvider outermost so Convex queries can read auth state".

## Scenario 5: `scripts/check-patterns.sh` enforces the env-loader invariant

Given the developer reads `process.env.*` anywhere outside `apps/reference/lib/env.ts`
When `scripts/check-patterns.sh` runs in CI
Then the check fails with the message about `process.env outside apps/reference/lib/env.ts`
And `apps/reference/next.config.mjs` is the only documented exception (grandfathered or absent).
