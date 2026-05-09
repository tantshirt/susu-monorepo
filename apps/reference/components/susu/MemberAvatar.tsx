"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * `<MemberAvatar />` — deterministic avatar for a Solana wallet pubkey.
 *
 * Story 7.11 (FR15 / UX-DR family). Renders the shadcn `Avatar` primitive
 * with two-character initials derived from the first four pubkey chars and
 * a deterministic surface-token tint so every member in a `<RotationCard />`
 * has a stable visual identity without any image fetch.
 *
 * Cross-skin: tint indices map to token classes, not raw colors. The same
 * pubkey renders with the neutral palette under the neutral skin and the
 * diaspora palette under `[data-skin="diaspora"]` because the underlying
 * tokens (`bg-surface2`, `bg-info`, `bg-signal`, `bg-warn`, `bg-primary`)
 * already swap per skin. No `process.env`, no random — pure derivation.
 *
 * Story 7.14, 7.15, 7.17 consume this for member rosters; Story 8.1 README
 * hero embeds it as part of the `<RotationCard />` snapshot.
 */
export type MemberAvatarSize = "sm" | "md" | "lg";

export interface MemberAvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Solana wallet pubkey (base58). Used for both initials and tint. */
  pubkey: string;
  /** Avatar size — `md` is the default rotation-card density. */
  size?: MemberAvatarSize;
  /** Optional explicit display name; falls back to truncated pubkey. */
  displayName?: string | null;
  /** Whether this avatar represents the current rotation recipient. */
  highlighted?: boolean;
}

const SIZE_CLASS: Record<MemberAvatarSize, string> = {
  sm: "h-6 w-6 text-caption",
  md: "h-10 w-10 text-body",
  lg: "h-14 w-14 text-h3",
};

// Five token-only tints. `bg-surface2` is the safe fallback; the rest swap
// across `[data-skin]` automatically because the tokens themselves swap.
const TINT_CLASSES = [
  "bg-surface2 text-text",
  "bg-info text-bg",
  "bg-signal text-bg",
  "bg-warn text-bg",
  "bg-primary text-bg",
] as const;

/**
 * Cheap deterministic hash (FNV-1a 32-bit) over the pubkey string.
 * Pure, no external deps; only used to pick a tint index.
 */
function hashPubkey(pubkey: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < pubkey.length; i++) {
    hash ^= pubkey.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // Force unsigned 32-bit so the modulo below is positive.
  return hash >>> 0;
}

function deriveInitials(pubkey: string): string {
  const slice = pubkey.slice(0, 4);
  // Take chars at index 0 and 2 ("first 2 of first 4 chars" per spec).
  const a = slice.charAt(0) || "?";
  const b = slice.charAt(2) || a;
  return (a + b).toUpperCase();
}

function truncatePubkey(pubkey: string): string {
  if (pubkey.length <= 8) return pubkey;
  return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
}

export const MemberAvatar = React.forwardRef<HTMLSpanElement, MemberAvatarProps>(
  ({ pubkey, size = "md", displayName, highlighted, className, ...props }, ref) => {
    const initials = deriveInitials(pubkey);
    const tint = TINT_CLASSES[hashPubkey(pubkey) % TINT_CLASSES.length]!;
    const label = displayName?.trim() || truncatePubkey(pubkey);
    return (
      <Avatar
        ref={ref}
        className={cn(
          SIZE_CLASS[size],
          highlighted && "ring-2 ring-primary ring-offset-2 ring-offset-bg",
          className,
        )}
        aria-label={label}
        title={label}
        {...props}
      >
        <AvatarFallback className={cn("font-mono numeric", tint)}>{initials}</AvatarFallback>
      </Avatar>
    );
  },
);
MemberAvatar.displayName = "MemberAvatar";
