/**
 * Convex schema — group metadata only (ARCH-30).
 *
 * This schema deliberately stores **only** off-chain UX metadata that the on-chain
 * program cannot or should not own (display strings, locale preference, invite
 * link tokens). The on-chain `Group` PDA remains the source of truth for
 * membership, contributions, and rotation. Convex is non-blocking: if the
 * deployment is unreachable, the protocol still works — the UI just falls back
 * to PDA addresses for labels.
 *
 * Three tables:
 *   - groupMetadata: human-readable group name + UI locale, keyed by groupPda.
 *   - inviteLinks:   off-chain shareable token mapping a UUID/short-code back
 *                    to a groupPda so the join URL doesn't leak the full PDA.
 *   - memberDisplayNames: per-(groupPda, memberPubkey) display name, with a
 *                    GDPR Article 17 erasure mutation in `groups.ts` that wipes
 *                    every row for a given memberPubkey on request.
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  groupMetadata: defineTable({
    groupPda: v.string(),
    name: v.string(),
    locale: v.string(),
    createdAt: v.number(),
  }).index("by_groupPda", ["groupPda"]),

  inviteLinks: defineTable({
    groupPda: v.string(),
    token: v.string(),
    createdAt: v.number(),
  })
    .index("by_groupPda", ["groupPda"])
    .index("by_token", ["token"]),

  memberDisplayNames: defineTable({
    groupPda: v.string(),
    memberPubkey: v.string(),
    displayName: v.string(),
    createdAt: v.number(),
  })
    .index("by_member", ["memberPubkey"])
    .index("by_group_member", ["groupPda", "memberPubkey"]),
});

export default schema;
