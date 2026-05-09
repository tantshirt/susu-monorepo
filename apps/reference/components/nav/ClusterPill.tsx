import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/env";

/**
 * Story 7.6 — `<ClusterPill />`.
 *
 * Always-visible pill that surfaces the active Solana cluster on every
 * reference-app screen (FR47, NFR-S8, UX-DR16). The *label* is the source of
 * truth — color-coding is a secondary affordance for sighted users.
 *
 *   - `mainnet-beta` → `signal` (mint primary) — protocol identity, real funds
 *   - `devnet`       → `warn`   — non-real funds; visually distinct from mainnet
 *   - `testnet`      → `warn`   — non-real funds
 *   - `localnet`     → `default` (muted surface) — local-only
 *
 * The component reads `NEXT_PUBLIC_CLUSTER` exclusively through `lib/env.ts`,
 * so `scripts/check-patterns.sh` (no raw `process.env` outside env.ts) stays
 * green.
 *
 * Per UX-DR16 we never conditionally hide this pill — even on `/404` the
 * active cluster must be visible. Adding `return null` here is a regression.
 */
type Cluster = "mainnet-beta" | "devnet" | "testnet" | "localnet";

function variantFor(cluster: Cluster): "signal" | "warn" | "default" {
  if (cluster === "mainnet-beta") return "signal";
  if (cluster === "devnet" || cluster === "testnet") return "warn";
  return "default";
}

export function ClusterPill() {
  const cluster = env.NEXT_PUBLIC_CLUSTER as Cluster;
  return (
    <Badge
      variant={variantFor(cluster)}
      aria-label={`Active Solana cluster: ${cluster}`}
      data-cluster={cluster}
    >
      {cluster}
    </Badge>
  );
}

export default ClusterPill;
