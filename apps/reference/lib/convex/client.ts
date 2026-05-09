/**
 * Singleton ConvexReactClient for the reference app.
 *
 * Per ARCH-31, this file is one of only three locations in `apps/reference/`
 * that may import from `convex/*`. The provider wrapper and the hooks below
 * consume the singleton from here.
 *
 * Convex is metadata-only (ARCH-30): if the deployment URL is invalid or the
 * deployment is unreachable, the on-chain protocol flows still complete. The
 * client is constructed eagerly so the singleton identity is stable for React
 * memoization, but failures are surfaced lazily by individual hooks.
 */

import { ConvexReactClient } from "convex/react";
import { env } from "@/lib/env";

export const convexClient = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);
