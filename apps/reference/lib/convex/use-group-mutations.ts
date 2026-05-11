/**
 * Mutation hooks for the off-chain `groupMetadata` and `inviteLinks` tables.
 *
 * Like the read-side helpers (`use-group-metadata.ts`, `use-invite-link.ts`),
 * these wrap `convex/react`'s `useMutation` so the rest of the app never
 * imports `convex/react` directly — `scripts/check-patterns.sh` enforces
 * this isolation rule.
 *
 * Returns are typed as plain async functions so call sites stay simple.
 */

"use client";

import { useMutation } from "convex/react";

export type UpsertGroupMetadataInput = {
  groupPda: string;
  name: string;
  locale: string;
};

export type CreateInviteLinkInput = {
  groupPda: string;
  token: string;
  createdBy?: string;
  expiresAt?: number;
  maxUses?: number;
};

export function useUpsertGroupMetadata(): (args: UpsertGroupMetadataInput) => Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useMutation("groups:upsertGroupMetadata" as any) as unknown as (
    args: UpsertGroupMetadataInput,
  ) => Promise<unknown>;
}

export function useCreateInviteLink(): (args: CreateInviteLinkInput) => Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useMutation("groups:createInviteLink" as any) as unknown as (
    args: CreateInviteLinkInput,
  ) => Promise<unknown>;
}
