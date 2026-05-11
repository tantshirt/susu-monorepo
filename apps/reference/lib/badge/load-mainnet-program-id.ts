import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Story 9.4 — Resolve the mainnet program id for the
 * `<UpgradeBurnedBadge />` route.
 *
 * Resolution order:
 *   1. `MAINNET_PROGRAM_ID.md` at the repo root (committed by Story 9.2's
 *      `scripts/deploy-mainnet.sh` after the irreversible deploy + burn).
 *   2. `NEXT_PUBLIC_PROGRAM_ID` env var (already wired in `route.ts` via
 *      `lib/env.ts`).
 *
 * Returning `undefined` is the explicit "pre-mainnet" signal — the badge
 * route falls back to the `pending` state.
 */
export function loadMainnetProgramIdFromFile(): string | undefined {
  const candidate = path.resolve(process.cwd(), "..", "..", "MAINNET_PROGRAM_ID.md");
  const fallback = path.resolve(process.cwd(), "MAINNET_PROGRAM_ID.md");
  const target = existsSync(candidate) ? candidate : existsSync(fallback) ? fallback : null;
  if (!target) return undefined;

  const contents = readFileSync(target, "utf8");
  // The Story 9.2 template writes the program id as a backticked cell in
  // the row `| Program ID | \`<id>\` |`. Parse defensively — if the file
  // exists but the row is malformed, treat as pre-mainnet rather than
  // crashing the badge.
  const match = contents.match(/^\|\s*Program ID\s*\|\s*`([^`]+)`/m);
  if (!match) return undefined;
  const id = match[1].trim();
  return id.length > 0 ? id : undefined;
}
