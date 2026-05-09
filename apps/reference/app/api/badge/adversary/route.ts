import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  renderAdversarySvg,
  resolveAdversaryState,
} from "@/lib/badge/adversary";
import type { AdversaryReport } from "@/lib/badge/types";

/**
 * Susu reference app — `<AdversaryBadge />` Route Handler
 * (Story 8.2, ARCH-36, UX-DR17).
 *
 * Server-renders an SVG badge from the latest, committed adversary
 * artifact at `audits/adversary/adversary-report.json` (Story 5.4). The
 * file is part of the repo, so we read it synchronously via Node `fs`.
 * Network fetches are explicitly forbidden — the badge must reflect the
 * exact commit deployed.
 *
 * ISR: with `dynamic = "force-static"` and `revalidate = 600`, Next.js
 * materialises the SVG at build time (when the report is on disk) and
 * the edge cache holds it for 10 minutes; a Vercel webhook rebuild on
 * push picks up artifact changes immediately. The browser-facing
 * `max-age=60` keeps personal caches short so judges always see a
 * recent state.
 */

const REPORT_RELATIVE_PATH = "audits/adversary/adversary-report.json";

/**
 * Walk up from a starting directory looking for the committed adversary
 * report. We try `process.cwd()` first (which is the Next.js project root
 * — `apps/reference/` — during `next build`) and walk up at most a few
 * levels until we hit the monorepo root or the filesystem root.
 *
 * Falling back to a multi-level search keeps the route resilient across:
 *   - local dev (`apps/reference/` cwd)
 *   - monorepo-root invocations (`pnpm --filter @susu/reference build`)
 *   - serverless bundling (Vercel includes the file via `outputFileTracing`)
 */
function resolveReportPath(): string {
  let dir = process.cwd();
  for (let depth = 0; depth < 6; depth++) {
    const candidate = path.join(dir, REPORT_RELATIVE_PATH);
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  // Fall back to the cwd-relative path so the caller still sees a
  // sensible ENOENT path string in error logs.
  return path.resolve(process.cwd(), REPORT_RELATIVE_PATH);
}

/**
 * Reads and parses the committed adversary report. Returns `null` when
 * the file is missing or unparseable so the badge can fall through to
 * the `pending` state without throwing.
 *
 * Exported for testability — `route.test.ts` mocks `readFileSync` and
 * exercises the three states by overriding the module.
 */
export function loadAdversaryReport(
  reader: typeof readFileSync = readFileSync,
  filePath: string = resolveReportPath(),
): AdversaryReport | null {
  try {
    const raw = reader(filePath, "utf8");
    const parsed = JSON.parse(raw as string) as AdversaryReport;
    return parsed;
  } catch {
    return null;
  }
}

export async function GET(): Promise<Response> {
  const report = loadAdversaryReport();
  const state = resolveAdversaryState(report);
  const svg = renderAdversarySvg(state, report);

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Browser caches for 60s; Vercel edge cache for 10m, with
      // `stale-while-revalidate` so a redeploy never serves a blank gap.
      "Cache-Control": "public, max-age=60, s-maxage=600, stale-while-revalidate=86400",
      // Hint to GitHub README image rendering pipelines that the SVG is
      // safe inline content.
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// Vercel ISR: redeploy on push regenerates the route bundle. We additionally
// pin `dynamic = "force-static"` so the badge is materialised at build time
// (the report is build-time content) and `revalidate = 600` so any rebuild
// triggered by webhook refreshes cached output within ten minutes.
export const dynamic = "force-static";
export const revalidate = 600;
