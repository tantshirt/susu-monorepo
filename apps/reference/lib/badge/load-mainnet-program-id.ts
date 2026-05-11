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
 *
 * The repo-root walk uses `pnpm-workspace.yaml` as the root marker so the
 * resolver works regardless of which directory Next.js was invoked from
 * (Vercel monorepo "root directory" config, `pnpm --filter @susu/reference
 * build` from repo root, `pnpm dev` inside `apps/reference/`, etc.).
 */
export function loadMainnetProgramIdFromFile(): string | undefined {
  const repoRoot = findRepoRoot(process.cwd());
  if (repoRoot === null) return undefined;

  const target = path.join(repoRoot, "MAINNET_PROGRAM_ID.md");
  if (!existsSync(target)) return undefined;

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

function findRepoRoot(start: string): string | null {
  let dir = path.resolve(start);
  // Walk at most 8 levels up — defends against pathological cwd values
  // without requiring an unbounded loop.
  for (let i = 0; i < 8; i++) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}
