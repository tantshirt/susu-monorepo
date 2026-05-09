# Story 7.13 ATDD: Convex schema + group metadata + isolation lock (ARCH-30, ARCH-31)

## Scenario 1: Convex schema defines the three group metadata tables (ARCH-30)

Given the reference app from Story 7.1
When `apps/reference/convex/schema.ts` is loaded
Then it imports `defineSchema` and `defineTable` from `convex/server` and `v` from `convex/values`
And it defines a `groupMetadata` table with at least `groupPda`, `name`, `locale`, and `createdAt` fields
And it defines an `inviteLinks` table with at least `groupPda`, `token`, and `createdAt` fields
And it defines a `memberDisplayNames` table with at least `groupPda`, `memberPubkey`, and `displayName` fields
And the schema module is the default export.

## Scenario 2: `groups.ts` exposes query + mutation functions including the GDPR Article 17 erasure mutation

Given `apps/reference/convex/groups.ts`
When the module is loaded
Then it exports a `getGroupMetadata` query that takes a `groupPda` argument
And it exports an `upsertGroupMetadata` mutation that writes name + locale fields keyed by `groupPda`
And it exports an `eraseUserData` mutation that, given a `memberPubkey`, deletes all rows in `memberDisplayNames` for that pubkey (Article 17 erasure)
And every write helper acquires a per-group isolation lock keyed by `groupPda` before mutating, so concurrent writes to the same group are serialized (ARCH-31).

## Scenario 3: Isolation lock — only `apps/reference/lib/convex/` may import `convex/*`

Given the structural import isolation rule (ARCH-31)
When `scripts/check-patterns.sh` runs
Then any `import ... from "convex"` or `from "convex/react"` or `from "@convex-dev/..."` outside `apps/reference/lib/convex/` (excluding the existing `ConvexProviderWrapper.tsx` exception) fails CI
And `apps/reference/lib/convex/client.ts`, `apps/reference/lib/convex/use-group-metadata.ts`, and `apps/reference/lib/convex/use-invite-link.ts` are the only files that import `convex/*` or `@convex-dev/*` from the reference app surface (the provider wrapper is grandfathered).

## Scenario 4: `lib/convex/client.ts` exports a `ConvexReactClient` singleton

Given `apps/reference/lib/convex/client.ts`
When the module is imported
Then it constructs a `ConvexReactClient` from `NEXT_PUBLIC_CONVEX_URL` (via the `@/lib/env` loader)
And it exports the client instance for use by the provider wrapper and the `use-*` hooks
And `apps/reference/app/providers/ConvexProviderWrapper.tsx` imports the client from `@/lib/convex/client` rather than constructing its own.

## Scenario 5: Convex absence is non-blocking (graceful degradation)

Given `NEXT_PUBLIC_CONVEX_URL` is unset or invalid at runtime
When the on-chain join + contribute + claim flows run
Then the protocol completes successfully because Convex is metadata-only, not a hard dependency
And the `lib/convex/use-group-metadata.ts` and `use-invite-link.ts` hooks return `null` / undefined gracefully so consumers can fall back to on-chain-only data.
