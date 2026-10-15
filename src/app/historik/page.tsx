import { Suspense } from "react";
import { HistoryView } from "@/components/history-view";
import { LoadError } from "@/components/ui";
import { load } from "@/lib/load";
import { titleFrom } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const generateMetadata = titleFrom((d) => d.history.title);

export default async function HistoryPage() {
  const res = await load();
  if (!res.ok) return <LoadError error={res.error} />;
  return (
    <Suspense>
      <HistoryView data={res.data} />
    </Suspense>
  );
}
