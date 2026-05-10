/**
 * React hook resolving an off-chain invite-link `token` back to its `groupPda`.
 *
 * Returns `undefined` while loading and `null` if no invite-link row exists.
 * Like `useGroupMetadata`, this hook is non-blocking — when Convex is absent
 * the UI must still allow the user to paste a raw groupPda directly.
 */

"use client";

import { useQuery } from "convex/react";

export type InviteLinkRow = {
  groupPda: string;
  token: string;
  status?: "active" | "revoked";
  expiresAt?: number;
  maxUses?: number;
  uses?: number;
  createdBy?: string;
  createdAt: number;
} | null;

export function useInviteLink(token: string | null): InviteLinkRow | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = useQuery("groups:getInviteLink" as any, token ? { token } : "skip");
  if (token === null) return null;
  return result as InviteLinkRow | undefined;
}
