import { CreateGroupClient } from "./CreateGroupClient";

export default async function NewGroupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <CreateGroupClient locale={locale} />;
}
