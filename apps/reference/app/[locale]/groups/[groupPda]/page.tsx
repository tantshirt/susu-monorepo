import { GroupDetailClient } from "./GroupDetailClient";

/**
 * Group detail — production shell keyed by group PDA.
 */
export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; groupPda: string }>;
}) {
  const { locale, groupPda } = await params;
  return <GroupDetailClient groupPda={groupPda} locale={locale} />;
}
