import { AddMatchForm } from "@/components/add-match-form";
import { LoadError } from "@/components/ui";
import { todayStockholm } from "@/lib/date";
import { load } from "@/lib/load";
import { titleFrom } from "@/lib/meta";
import { playersByRecency } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const generateMetadata = titleFrom((d) => d.add.title);

export default async function NewMatchPage() {
  const res = await load();
  if (!res.ok) return <LoadError error={res.error} />;
  return <AddMatchForm players={playersByRecency(res.data)} today={todayStockholm()} />;
}
