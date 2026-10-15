import { HomeView } from "@/components/home-view";
import { LoadError } from "@/components/ui";
import { load } from "@/lib/load";

export const dynamic = "force-dynamic";

export default async function Home() {
  const res = await load();
  if (!res.ok) return <LoadError error={res.error} />;
  return <HomeView data={res.data} />;
}
