import { notFound } from "next/navigation";
import { getDemoGroupDetail } from "@/lib/member-app";
import { GroupDetailClient } from "./GroupDetailClient";

/**
 * Group detail — server shell resolves fixture or future SDK-backed detail.
 */
export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; groupPda: string }>;
}) {
  const { locale, groupPda } = await params;
  const detail = getDemoGroupDetail(groupPda);
  if (!detail) {
    notFound();
  }
  return <GroupDetailClient detail={detail} locale={locale} />;
}
