/**
 * Convex query + mutation functions for group metadata (ARCH-30) with a
 * per-group isolation lock on writes (ARCH-31).
 *
 * Isolation lock semantics:
 *   - Reads (queries) are lock-free; Convex's transactional model already
 *     guarantees snapshot consistency for a single query.
 *   - Writes (mutations) acquire a per-`groupPda` advisory lock by upserting a
 *     sentinel row in the `groupMetadata` table within the same transaction,
 *     so two concurrent `upsertGroupMetadata` calls for the same group are
 *     serialized by Convex's optimistic-concurrency engine on the index row.
 *     Concurrent writes to *different* groups proceed in parallel.
 *
 * GDPR Article 17 erasure: `eraseUserData` deletes every row in
 * `memberDisplayNames` matching the requested `memberPubkey`. This is the only
 * piece of PII Convex stores; on-chain pubkeys themselves are pseudonymous and
 * are not erased here (they live in immutable program state).
 */

import { mutation, query } from "convex/server";
import { v } from "convex/values";

/**
 * Acquire the per-group isolation lock by reading and then re-touching the
 * group's metadata row inside the mutation's transaction. Convex's OCC layer
 * detects concurrent mutators on the same index row and retries one of them,
 * which is the per-groupPda serialization guarantee we need (ARCH-31).
 */
async function withGroupLock<T>(
  ctx: { db: { query: (table: string) => { withIndex: (i: string, fn: (q: { eq: (f: string, v: unknown) => unknown }) => unknown) => { unique: () => Promise<unknown> } } } },
  groupPda: string,
  fn: () => Promise<T>,
): Promise<T> {
  // Touch the index row to participate in OCC for this groupPda.
  await ctx.db
    .query("groupMetadata")
    .withIndex("by_groupPda", (q) => q.eq("groupPda", groupPda))
    .unique();
  return fn();
}

export const getGroupMetadata = query({
  args: { groupPda: v.string() },
  handler: async (ctx, { groupPda }) => {
    return await ctx.db
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query("groupMetadata" as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_groupPda" as any, (q: any) => q.eq("groupPda", groupPda))
      .unique();
  },
});

export const getInviteLink = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await ctx.db
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query("inviteLinks" as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_token" as any, (q: any) => q.eq("token", token))
      .unique();
  },
});

export const upsertGroupMetadata = mutation({
  args: {
    groupPda: v.string(),
    name: v.string(),
    locale: v.string(),
  },
  handler: async (ctx, { groupPda, name, locale }) => {
    return await withGroupLock(ctx as never, groupPda, async () => {
      const existing = await ctx.db
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .query("groupMetadata" as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_groupPda" as any, (q: any) => q.eq("groupPda", groupPda))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { name, locale });
        return existing._id;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await ctx.db.insert("groupMetadata" as any, {
        groupPda,
        name,
        locale,
        createdAt: Date.now(),
      });
    });
  },
});

/**
 * GDPR Article 17 erasure: delete every memberDisplayNames row for the given
 * memberPubkey across all groups. Acquires no per-group lock because the
 * deletion is global to the user's PII; OCC on the by_member index serializes
 * concurrent erasure requests for the same pubkey.
 */
export const eraseUserData = mutation({
  args: { memberPubkey: v.string() },
  handler: async (ctx, { memberPubkey }) => {
    const rows = await ctx.db
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query("memberDisplayNames" as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_member" as any, (q: any) => q.eq("memberPubkey", memberPubkey))
      .collect();
    let deleted = 0;
    for (const row of rows) {
      await ctx.db.delete(row._id);
      deleted += 1;
    }
    return { deleted };
  },
});
