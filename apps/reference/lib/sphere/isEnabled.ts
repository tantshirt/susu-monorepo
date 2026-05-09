/**
 * Story 7.16 — Sphere on-ramp optional flag (FR44, NFR-R3).
 *
 * `isSphereEnabled()` returns the env-loader's view of
 * `NEXT_PUBLIC_SPHERE_ENABLED`. The env loader (`@/lib/env`) parses the raw
 * string `"true" | "false"` into a boolean at load time, so callers here
 * never see the string form.
 *
 * Server-safe AND client-safe — no `window` references.
 */

import { env } from "@/lib/env";

export function isSphereEnabled(): boolean {
  return env.NEXT_PUBLIC_SPHERE_ENABLED === true;
}
