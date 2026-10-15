"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";
import { CaretRight } from "@phosphor-icons/react";
import { addPlayer, type ActionError } from "@/app/actions";
import { fmt } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import { activeMatches, playerStats } from "@/lib/stats";
import type { Data } from "@/lib/types";
import { useToast } from "./toast";
import { EmptyState, FormBadges, PageHeader, plural } from "./ui";

export function PlayersView({ data }: { data: Data }) {
  const { d } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [err, setErr] = useState<ActionError | null>(null);
  const [pending, start] = useTransition();
  const inputId = useId();
  const errId = useId();

  const rows = useMemo(() => {
    const matches = activeMatches(data);
    return data.players
      .map((p) => playerStats(p, matches))
      .sort((a, b) => a.name.localeCompare(b.name, "sv"));
  }, [data]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await addPlayer(name).catch(() => ({ ok: false as const, error: "server" as const }));
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setName("");
      setErr(null);
      toast({ message: fmt(d.players.added, { name: res.value.name }), duration: 3000 });
      router.refresh();
    });
  };

  return (
    <div className="enter">
      <PageHeader title={d.players.title} />

      <form onSubmit={submit} noValidate className="mb-8">
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
          {d.players.add}
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            value={name}
            maxLength={40}
            autoComplete="off"
            autoCapitalize="words"
            onChange={(e) => {
              setName(e.target.value);
              setErr(null);
            }}
            aria-invalid={!!err || undefined}
            aria-describedby={err ? errId : undefined}
            className="min-h-12 min-w-0 flex-1 rounded-box border border-line bg-surface px-3 text-base"
          />
          <button
            type="submit"
            disabled={pending}
            className="min-h-12 rounded-full bg-accent px-5 font-semibold text-accent-ink active:scale-[0.98] disabled:opacity-60"
          >
            {d.add.addPlayer}
          </button>
        </div>
        <div aria-live="polite">
          {err && (
            <p id={errId} className="mt-1.5 text-sm font-medium text-danger">
              {d.errors[err]}
            </p>
          )}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState>{d.players.empty}</EmptyState>
      ) : (
        <ul className="grid">
          {rows.map((r) => (
            <li key={r.id} className="border-b border-line/70">
              <Link
                href={`/spelare/${r.id}`}
                className="group flex min-h-16 items-center gap-3 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium group-hover:underline">{r.name}</span>
                  <span className="text-sm text-muted">
                    {r.played === 0
                      ? d.players.noGames
                      : `${plural(r.played, d.players.gamesOne, d.players.games)}, ${r.wins}-${r.losses}`}
                  </span>
                </span>
                <FormBadges form={r.form} size="sm" />
                <CaretRight size={16} className="text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
