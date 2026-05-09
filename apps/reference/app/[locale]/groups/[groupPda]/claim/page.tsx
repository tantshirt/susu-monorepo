import { ClaimClient } from "./ClaimClient";

/**
 * Story 7.15 — One-tap Claim Payout route.
 *
 * Server Component shell that:
 *   1. Reads `groupPda` and `locale` from route params (Next.js 15 dynamic
 *      params are async — we await once and forward).
 *   2. Hands the client orchestrator the `groupPda` so it can wire the SDK
 *      `claimPayout()` flow + Convex metadata. Convex fetching is gated
 *      inside `<ClaimClient />` so a Convex outage doesn't break the page
 *      render (issue #79 AC).
 *
 * No data fetching happens here today — group + rotation metadata is sourced
 * from Convex via the client hook. Story 7.17 (group-detail capstone) will
 * pre-fetch real rotation state via the SDK; until then the placeholder
 * rotation exercises the three guard branches at the UI layer.
 */
export default async function ClaimPage({
  params,
}: {
  params: Promise<{ locale: string; groupPda: string }>;
}) {
  const { locale, groupPda } = await params;
  return <ClaimClient groupPda={groupPda} locale={locale} />;
}
