import { cookies } from "next/headers";

/**
 * Story 7.5 — server-side skin reader.
 *
 * The `<SkinToggle />` Client Component writes both a `localStorage` entry
 * and a `susu-skin` cookie (`Path=/`, `Max-Age=31536000`, `SameSite=Lax`).
 * The cookie is the SSR-readable source of truth: the root server-component
 * layout calls `getServerSkin()` and stamps `<html data-skin={skin}>` so the
 * very first byte of HTML matches the persisted skin — no flash of unstyled
 * content during hydration.
 *
 * `localStorage` is mirrored client-side and reconciled by a small
 * pre-hydration `<script>` block injected at the top of `<body>`; if it
 * holds a different value than the cookie (e.g., user toggled in another
 * tab), it overrides `document.documentElement.dataset.skin` synchronously
 * before React hydrates.
 */
export type Skin = "neutral" | "diaspora";

export const SKIN_COOKIE = "susu-skin";
export const DEFAULT_SKIN: Skin = "neutral";

function isSkin(value: string | undefined): value is Skin {
  return value === "neutral" || value === "diaspora";
}

export async function getServerSkin(): Promise<Skin> {
  const store = await cookies();
  const value = store.get(SKIN_COOKIE)?.value;
  return isSkin(value) ? value : DEFAULT_SKIN;
}
