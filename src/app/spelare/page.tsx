import { PlayersView } from "@/components/players-view";
import { LoadError } from "@/components/ui";
import { load } from "@/lib/load";
import { titleFrom } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const generateMetadata = titleFrom((d) => d.players.title);

export default async function PlayersPage() {
  const res = await load();
  if (!res.ok) return <LoadError error={res.error} />;
  return <PlayersView data={res.data} />;
}
