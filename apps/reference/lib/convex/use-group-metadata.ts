/**
 * React hook returning off-chain `groupMetadata` for a given `groupPda`.
 *
 * Returns `undefined` while loading and `null` if the group has no metadata
 * row (Convex empty state) or if the deployment is unreachable. Consumers
 * should fall back to the on-chain PDA address as a label in either case —
 * Convex is non-blocking metadata, never a hard dependency (issue #77 AC).
 */

"use client";

import { useQuery } from "convex/react";

export type GroupMetadata = {
  groupPda: string;
  name: string;
  locale: string;
  createdAt: number;
} | null;

export function useGroupMetadata(groupPda: string | null): GroupMetadata | undefined {
  // The function reference would normally come from `convex/_generated/api`;
  // until codegen runs we accept a string identifier and let Convex resolve
  // it at runtime. The hook still types its return shape.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = useQuery("groups:getGroupMetadata" as any, groupPda ? { groupPda } : "skip");
  if (groupPda === null) return null;
  return result as GroupMetadata | undefined;
}
