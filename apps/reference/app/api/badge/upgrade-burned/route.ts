import {
  createUpgradeBurnedRpc,
  resolveUpgradeBurnedState,
  type UpgradeBurnedRpc,
} from "@/lib/badge/upgrade-burned-resolver";
import { renderUpgradeBurnedSvg } from "@/lib/badge/upgrade-burned";
import { env } from "@/lib/env";

/**
 * Susu reference app — `<UpgradeBurnedBadge />` Route Handler
 * (Story 8.3, ARCH-37, UX-DR18).
 *
 * Server-renders an SVG badge that proves the deployed program is
 * immutable by reading the BPFLoaderUpgradeable program-data account
 * directly via `@solana/kit` RPC against `mainnet-beta`. We deliberately
 * do NOT shell out to `solana program show` — the CLI would drag the
 * Solana toolchain into the Next.js runtime and break Vercel builds.
 *
 * The actual RPC plumbing lives in
 * `lib/badge/upgrade-burned-resolver.ts` so it can be unit-tested
 * without coupling to `@/lib/env`'s startup validation. This module
 * owns env reads + ISR cache headers + the SVG response shape only.
 *
 * The System Program incinerator address —
 * `1nc1nerator11111111111111111111111111111111` — is the only authority
 * value that flips this badge to `verified`. The literal lives next to
 * the renderer (`lib/badge/upgrade-burned.ts`) and is grep-visible from
 * both modules so static audits can confirm the constant.
 *
 * ISR: with `dynamic = "force-static"` and `revalidate = 600`, Next.js
 * materialises the SVG at build time and the edge cache holds it for ten
 * minutes. The browser-facing `max-age=60` keeps personal caches short.
 *
 * Network failures NEVER 500 — they degrade to `pending` so the README
 * row stays renderable when Solana mainnet RPC is having a bad day.
 */

let rpcFactory: () => UpgradeBurnedRpc = createUpgradeBurnedRpc;

/**
 * Test seam — replace the RPC factory with a hand-rolled mock so unit
 * tests can drive `GET()` without hitting the network. Pass `null` to
 * restore the default factory.
 */
export function setRpcFactoryForTesting(factory: (() => UpgradeBurnedRpc) | null): void {
  rpcFactory = factory ?? createUpgradeBurnedRpc;
}

/**
 * Test seam — override the resolved program id so unit tests can drive
 * `GET()` against the three states regardless of the validated env
 * shape. Pass `null` to restore env-driven resolution. Use empty-string
 * `""` to simulate the pre-Epic-9 "mainnet not deployed" state.
 */
let programIdOverride: string | null = null;
export function setProgramIdForTesting(programId: string | null): void {
  programIdOverride = programId;
}

export async function GET(): Promise<Response> {
  // The mainnet program id only exists once Epic 9 deploys; before that
  // the env var may be empty/missing. We treat that as `pending` rather
  // than failing the build.
  const programId =
    programIdOverride !== null
      ? programIdOverride
      : env.NEXT_PUBLIC_CLUSTER === "mainnet-beta"
        ? env.NEXT_PUBLIC_PROGRAM_ID
        : undefined;

  const rpc = rpcFactory();
  const { state, authorityOrProgramId } = await resolveUpgradeBurnedState(rpc, programId);
  const svg = renderUpgradeBurnedSvg(state, authorityOrProgramId);

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
// and `revalidate = 600` so any rebuild triggered by webhook refreshes
// cached output within ten minutes.
export const dynamic = "force-static";
export const revalidate = 600;
