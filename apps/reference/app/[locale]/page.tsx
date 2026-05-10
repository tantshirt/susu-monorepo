import { MemberDashboard } from "@/components/member/MemberDashboard";

/**
 * Member-first dashboard — see `components/member/MemberDashboard.tsx`.
 */
export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <MemberDashboard locale={locale} />;
}
