import { Suspense } from "react";
import { H2HView } from "@/components/h2h-view";
import { LoadError } from "@/components/ui";
import { load } from "@/lib/load";
import { titleFrom } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const generateMetadata = titleFrom((d) => d.h2h.title);

export default async function H2HPage() {
  const res = await load();
  if (!res.ok) return <LoadError error={res.error} />;
  return (
    <Suspense>
      <H2HView data={res.data} />
    </Suspense>
  );
}
