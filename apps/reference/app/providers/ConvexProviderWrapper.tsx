"use client";

import { ConvexProvider } from "convex/react";
import type { ReactNode } from "react";
import { convexClient } from "@/lib/convex/client";

/**
 * Convex client wrapper. Consumes the singleton `ConvexReactClient` from
 * `@/lib/convex/client` (Story 7.13, ARCH-30/31). The schema and queries live
 * under `apps/reference/convex/`; per the structural isolation rule no other
 * file outside `apps/reference/lib/convex/` may import `convex/*` (this
 * wrapper is the grandfathered exception that bridges the lock to the React
 * tree).
 */
export function ConvexProviderWrapper({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
