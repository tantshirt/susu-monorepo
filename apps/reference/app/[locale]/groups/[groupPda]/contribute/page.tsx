import { ContributeClient } from "./ContributeClient";

/**
 * Story 7.14 — One-tap Contribute route.
 *
 * Server Component shell that:
 *   1. Reads `groupPda` and `locale` from route params (Next.js 15 dynamic
 *      params are async — we await once and forward).
 *   2. Hands the client orchestrator the `groupPda` so it can wire the SDK
 *      `contribute()` flow + Convex metadata. Convex fetching is gated
 *      inside `<ContributeClient />` so a Convex outage doesn't break the
 *      page render (issue #77 AC).
 *
 * No data fetching happens here today — group metadata is sourced from
 * Convex via the client hook. A future revision may pre-fetch via the
 * Convex server SDK, but the first cut keeps the contract narrow.
 */
export default async function ContributePage({
  params,
}: {
  params: Promise<{ locale: string; groupPda: string }>;
}) {
  const { locale, groupPda } = await params;
  return <ContributeClient groupPda={groupPda} locale={locale} />;
}
