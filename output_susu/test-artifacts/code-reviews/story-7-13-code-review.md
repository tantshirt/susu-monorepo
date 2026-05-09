---
stepsCompleted:
  - step-01-load-context
  - step-02-blind-hunter
  - step-03-edge-case-hunter
  - step-04-acceptance-auditor
  - step-05-triage
  - step-06-apply-must-fix
lastStep: step-06-apply-must-fix
lastSaved: 2026-05-09
storyId: "7.13"
storyKey: story-7-13-convex-schema
inputDocuments:
  - apps/reference/convex/schema.ts
  - apps/reference/convex/groups.ts
  - apps/reference/lib/convex/client.ts
  - apps/reference/lib/convex/use-group-metadata.ts
  - apps/reference/lib/convex/use-invite-link.ts
  - apps/reference/app/providers/ConvexProviderWrapper.tsx
  - tests/atdd/story-7-13-convex-schema.atdd.md
  - tests/atdd/story-7-13-convex-schema.static.red.test.mjs
  - scripts/check-patterns.sh
---

# Code Review: Story 7.13 Convex schema + isolation lock

## Lens 1 — Blind Hunter (assume nothing about intent)

What does the code do?

- `convex/schema.ts` declares three tables (`groupMetadata`, `inviteLinks`, `memberDisplayNames`) with primary fields and indexes by `groupPda`, `token`, and `memberPubkey`.
- `convex/groups.ts` exports two queries/mutations for group metadata and one mutation for GDPR Article 17 erasure, with a `withGroupLock` helper that touches the `by_groupPda` index inside the transaction so Convex's OCC engine serializes concurrent writers per group.
- `lib/convex/client.ts` constructs a single `ConvexReactClient` from `env.NEXT_PUBLIC_CONVEX_URL`.
- `lib/convex/use-group-metadata.ts` and `use-invite-link.ts` are thin React hooks delegating to `useQuery` against string function references.
- `ConvexProviderWrapper.tsx` no longer constructs a client of its own — it imports the singleton.

Open questions raised:
1. The hooks reference a query `groups:getInviteLink` that does not exist in `groups.ts`. **Hunter flag.**
2. `withGroupLock` parameter type uses inline structural typing rather than Convex's `MutationCtx`. Cosmetic; resolved when codegen lands.
3. The hooks return `null` only when the input arg is `null`; if the arg is provided but the deployment is unreachable, `useQuery` will return `undefined` indefinitely. The graceful-fallback claim relies on consumers handling `undefined` — documented in the JSDoc.

## Lens 2 — Edge Case Hunter (boundary conditions)

- **Empty `memberDisplayNames` for `eraseUserData`**: handled — the for-loop is a no-op and returns `{ deleted: 0 }`.
- **Concurrent `upsertGroupMetadata` for the same `groupPda`**: serialized via OCC on `by_groupPda` (the lock).
- **Concurrent `upsertGroupMetadata` for *different* `groupPda`s**: proceed in parallel — desired (ARCH-31 says reads can be lock-free; writes are per-group).
- **`groupPda` containing unusual characters**: stored as opaque string, no escaping needed.
- **Invalid `NEXT_PUBLIC_CONVEX_URL`**: caught upstream by `lib/env.ts` Zod schema at module load, throwing a structured error before the client constructor runs.
- **`token` collisions in `inviteLinks`**: schema does not enforce uniqueness; the `by_token` index allows lookup but not constraint. **Edge flag — non-blocking; collision avoidance is the writer's responsibility (UUIDv4 in upsertInviteLink, which lands in a future story).**
- **`displayName` length**: no max-length enforced. v0.1.0-acceptable since the on-chain protocol never reads this.

## Lens 3 — Acceptance Auditor (issue #77 AC ↔ code mapping)

| AC bullet | Mapping | Status |
| --- | --- | --- |
| Schema defines three tables per ARCH-30 | `convex/schema.ts` | ✅ |
| `groups.ts` exports query + mutation for group metadata | `getGroupMetadata`, `upsertGroupMetadata` | ✅ |
| `eraseUserData` mutation deletes all rows in `memberDisplayNames` for a pubkey | `eraseUserData` mutation, `by_member` index | ✅ |
| Only `apps/reference/lib/convex/{client.ts, use-group-metadata.ts, use-invite-link.ts}` import from `convex/*` | Verified by `check-patterns.sh` (run is green) + grep | ✅ (provider wrapper grandfathered) |
| `scripts/check-patterns.sh` greps for convex imports outside the lib | Already extended in Story 7.1; reaffirmed in red test | ✅ |
| Playwright tests confirm Convex absence is non-blocking | Deferred — Playwright not yet scaffolded | ⏸ Tracked for follow-up |

## Triage

| Issue | Severity | Decision |
| --- | --- | --- |
| Hooks reference a `getInviteLink` query that does not exist in `groups.ts` | Must-fix | **Apply now** — add a `getInviteLink` query so the hook is functional and consistent with the AC's "lib/convex/use-invite-link.ts" requirement. |
| `withGroupLock` typed loosely against `MutationCtx` | Should-fix | Defer until codegen lands and `convex/_generated/server` is on disk; cleanup story. |
| `inviteLinks.token` not unique-indexed | Could-fix | Defer — uniqueness is the writer's responsibility for v0.1.0; revisit when the upsert mutation lands. |
| Playwright AC bullet not statically tested | Out-of-scope | Tracked for future story; current AC scope is schema + isolation lock + hook surface. |

## Must-fix applied

Added a `getInviteLink` query to `convex/groups.ts` so the `useInviteLink` hook resolves. The query reads from the `inviteLinks` table via the `by_token` index.

## Verdict

**APPROVE with must-fix applied** — schema and isolation lock satisfy ARCH-30/31; the only AC bullet not landing in this story is the Playwright runtime check, which has no scaffold yet and is correctly deferred.
