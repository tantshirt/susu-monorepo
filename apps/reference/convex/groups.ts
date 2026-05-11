/**
 * Convex query + mutation functions for group metadata (ARCH-30) with a
 * per-group isolation lock on writes (ARCH-31).
 *
 * Isolation lock semantics:
 *   - Reads (queries) are lock-free; Convex's transactional model already
 *     guarantees snapshot consistency for a single query.
 *   - Writes (mutations) acquire a per-`groupPda` advisory lock by upserting a
 *     sentinel row in the `groupMetadata` table within the same transaction,
 *     so two concurrent `createGroupMetadata` calls for the same group are
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
    const row = await ctx.db
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query("inviteLinks" as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_token" as any, (q: any) => q.eq("token", token))
      .unique();
    if (!row) return null;
    if (row.status === "revoked") return null;
    if (typeof row.expiresAt === "number" && row.expiresAt <= Date.now()) return null;
    if (
      typeof row.maxUses === "number" &&
      typeof row.uses === "number" &&
      row.uses >= row.maxUses
    ) {
      return null;
    }
    return row;
  },
});

/**
 * Insert-only — refuses to patch an existing row.
 *
 * Authorization model: Convex auth wiring (Privy → JWT → ctx.auth) is not
 * yet hooked up in this app, so any anonymous client knowing the public
 * Convex URL can call this mutation. To prevent invite-link hijack — where
 * an attacker calls createInviteLink with an existing victim token and a
 * different groupPda, repointing the active token at the attacker's group —
 * the legitimate creator-only flow is enforced by making this insert-only.
 *
 * Once a token row exists, this mutation throws. Token rotation is
 * intentionally not supported here — to issue a new invite, generate a new
 * token. Revocation flows (status=revoked) are a future authenticated
 * mutation; until then, tokens are effectively single-issue.
 *
 * TODO(convex-auth): Once Privy → Convex auth is wired (separate issue),
 * lift the insert-only restriction and add an `existing.createdBy === identity.subject`
 * check on the patch path so legitimate creators can update their own links.
 */
export const createInviteLink = mutation({
  args: {
    groupPda: v.string(),
    token: v.string(),
    createdBy: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, { groupPda, token, createdBy, expiresAt, maxUses }) => {
    return await withGroupLock(ctx as never, groupPda, async () => {
      const existing = await ctx.db
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .query("inviteLinks" as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_token" as any, (q: any) => q.eq("token", token))
        .unique();
      if (existing) {
        // Refuse rather than silently patching — prevents anonymous-caller
        // hijack of an existing token. Caller must generate a new token.
        throw new Error("createInviteLink: token already exists; generate a new token");
      }
      const payload = {
        groupPda,
        token,
        status: "active" as const,
        uses: 0,
        ...(createdBy ? { createdBy } : {}),
        ...(typeof expiresAt === "number" ? { expiresAt } : {}),
        ...(typeof maxUses === "number" ? { maxUses } : {}),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await ctx.db.insert("inviteLinks" as any, {
        ...payload,
        createdAt: Date.now(),
      });
    });
  },
});

/**
 * Insert-only — refuses to patch an existing row.
 *
 * Same threat model as createInviteLink: without Convex auth wiring, any
 * anonymous caller could mass-rewrite group display names (turning every
 * group's UI label into a phishing string). Insert-only means the creator's
 * one-shot at group-creation time wins; subsequent calls are rejected.
 *
 * TODO(convex-auth): Once Privy → Convex auth is wired, lift the insert-only
 * restriction and add an authenticated update path tied to the on-chain
 * group creator pubkey.
 */
export const createGroupMetadata = mutation({
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
        throw new Error("createGroupMetadata: group already has metadata; updates require an authenticated mutation (post Convex-auth)");
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
 * GDPR Article 17 erasure — currently DISABLED.
 *
 * The previous implementation accepted any `memberPubkey` from any anonymous
 * caller and deleted every memberDisplayNames row matching it — a mass-PII
 * wipe vector. Until Convex auth (Privy → JWT) is wired and a wallet-bound
 * authorization check (or signed-message proof of pubkey ownership) is added,
 * this entry point throws. There is no UI caller in the current app, so
 * disabling does not regress any user-facing functionality. The function is
 * preserved as a stub so the API surface stays alignment-checkable.
 *
 * TODO(convex-auth): Replace the throw with a real handler that requires a
 * Solana ed25519 signature over `susu:erase:<memberPubkey>:<nonce>` (nonce =
 * timestamp ms within last 5 min) and verifies via @noble/ed25519 before
 * deletion. Tracked in a follow-up issue.
 */
export const eraseUserData = mutation({
  args: { memberPubkey: v.string() },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (_ctx, _args) => {
    throw new Error(
      "eraseUserData: disabled until Convex auth + signed-message proof-of-ownership is wired (see convex/groups.ts TODO)",
    );
  },
});
