/**
 * Skin type + constants shared by server and client.
 *
 * Do not import `next/headers` here — client components (`SkinToggle`, etc.)
 * must be able to import this module without pulling server-only APIs.
 */

export type Skin = "neutral" | "diaspora";

export const SKIN_COOKIE = "susu-skin";

export const DEFAULT_SKIN: Skin = "neutral";

export function isSkin(value: string | undefined): value is Skin {
  return value === "neutral" || value === "diaspora";
}
