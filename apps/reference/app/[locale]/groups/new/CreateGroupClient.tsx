"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Banner } from "@/components/susu/Banner";

const CreateGroupSolanaClient = dynamic(
  () => import("./CreateGroupSolanaClient").then((mod) => mod.CreateGroupSolanaClient),
  {
    ssr: false,
    loading: () => (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
        <Card className="overflow-hidden rounded-2xl border-border/70 bg-white/95 shadow-1">
          <CardHeader>
            <CardTitle>Loading create-circle flow</CardTitle>
            <CardDescription>Preparing wallet signing tools in the browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <Banner variant="info">Wallet actions load after the page reaches the browser.</Banner>
          </CardContent>
        </Card>
      </main>
    ),
  },
);

interface CreateGroupClientProps {
  locale: string;
}

export function CreateGroupClient({ locale }: CreateGroupClientProps) {
  return <CreateGroupSolanaClient locale={locale} />;
}
