"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useMemo, type ReactNode } from "react";
import { env } from "@/lib/env";

/**
 * Convex client wrapper. This story (7.1) only wires the runtime client.
 * The schema, queries, and isolation lock land in Story 7.13, which is also
 * when `convex/_generated` imports become legal here.
 */
export function ConvexProviderWrapper({ children }: { children: ReactNode }) {
  const client = useMemo(
    () => new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL),
    [],
  );
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
