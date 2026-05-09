"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/**
 * Story 7.5 — `<SkinToggle />`.
 *
 * Toggles the `data-skin` attribute on `<html>` between `"neutral"` and
 * `"diaspora"` (the two values defined by Story 7.2's `tokens.css` +
 * `skin-diaspora.css`). Persists to two stores so SSR + client agree:
 *
 *   - `localStorage["susu-skin"]` — fast client-side read.
 *   - `document.cookie` `susu-skin=...; Path=/; Max-Age=31536000; SameSite=Lax`
 *     — server-readable source of truth via `next/headers cookies()` so
 *     the root layout can render the right skin on the first paint with
 *     no flash of unstyled content.
 *
 * The visible label uses the shadcn `Button` primitive (Story 7.4) so the
 * mint primary token (cross-skin protocol identity per UX-DR direction)
 * carries through both skins.
 *
 * State is mirrored via `useSyncExternalStore`: the `<html data-skin>`
 * attribute is the live store; `subscribe` listens on a private
 * `EventTarget` that the toggle and any future cross-tab listener emit on.
 * This avoids setState-in-effect while letting the root layout seed the
 * server snapshot from the SSR cookie value.
 */

type Skin = "neutral" | "diaspora";

const COOKIE_KEY = "susu-skin";
const STORAGE_KEY = "susu-skin";
const ONE_YEAR_SECONDS = 31536000;

const SkinSnapshotContext = React.createContext<Skin>("neutral");

// Module-scoped event bus. Idempotent — server-side it's a no-op since the
// `EventTarget` constructor is available in modern Node, but we never
// dispatch from the server.
const skinEvents: EventTarget =
  typeof EventTarget !== "undefined" ? new EventTarget() : ({} as EventTarget);
const SKIN_CHANGED = "susu-skin-changed";

function readCurrentSkin(): Skin {
  if (typeof document === "undefined") return "neutral";
  const fromAttr = document.documentElement.dataset.skin;
  return fromAttr === "diaspora" ? "diaspora" : "neutral";
}

function persistSkin(skin: Skin) {
  // localStorage mirror — synchronously readable by the pre-hydration script.
  try {
    window.localStorage.setItem(STORAGE_KEY, skin);
  } catch {
    // localStorage may be disabled (private mode); cookie remains source of truth.
  }
  // Cookie — server-readable via next/headers cookies() in app/layout.tsx.
  document.cookie = `${COOKIE_KEY}=${skin}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

function applySkin(skin: Skin) {
  document.documentElement.dataset.skin = skin;
  if (typeof skinEvents.dispatchEvent === "function") {
    skinEvents.dispatchEvent(new Event(SKIN_CHANGED));
  }
}

function subscribeSkin(onChange: () => void): () => void {
  if (typeof skinEvents.addEventListener !== "function") return () => {};
  skinEvents.addEventListener(SKIN_CHANGED, onChange);
  return () => skinEvents.removeEventListener(SKIN_CHANGED, onChange);
}

type SkinProviderProps = Readonly<{
  initialSkin: Skin;
  children: React.ReactNode;
}>;

export function SkinProvider({ initialSkin, children }: SkinProviderProps) {
  return (
    <SkinSnapshotContext.Provider value={initialSkin}>
      {children}
    </SkinSnapshotContext.Provider>
  );
}

export function SkinToggle() {
  const serverSkin = React.useContext(SkinSnapshotContext);
  const getServerSnapshot = React.useCallback(() => serverSkin, [serverSkin]);

  const skin = React.useSyncExternalStore(
    subscribeSkin,
    readCurrentSkin,
    getServerSnapshot,
  );

  const toggle = React.useCallback(() => {
    const current = readCurrentSkin();
    const next: Skin = current === "neutral" ? "diaspora" : "neutral";
    applySkin(next);
    persistSkin(next);
  }, []);

  const label =
    skin === "neutral" ? "Switch to Diaspora skin" : "Switch to Neutral skin";

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={toggle}
      aria-label={label}
      data-skin-current={skin}
    >
      {skin === "neutral" ? "Diaspora" : "Neutral"}
    </Button>
  );
}

export default SkinToggle;
