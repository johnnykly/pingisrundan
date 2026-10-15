import type { Metadata } from "next";
import { ProfileView } from "@/components/profile-view";
import { LoadError } from "@/components/ui";
import { load } from "@/lib/load";
import { serverDict } from "@/lib/meta";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const res = await load();
  const name = res.ok ? res.data.players.find((p) => p.id === id)?.name : undefined;
  return { title: name ?? (await serverDict()).players.title };
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const res = await load();
  if (!res.ok) return <LoadError error={res.error} />;
  return <ProfileView data={res.data} id={id} />;
}
