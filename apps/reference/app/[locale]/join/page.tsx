import { JoinGroupClient } from "./JoinGroupClient";

export default async function JoinGroupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <JoinGroupClient locale={locale} />;
}
