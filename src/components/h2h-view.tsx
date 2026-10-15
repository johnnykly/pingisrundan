"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ArrowsLeftRight } from "@phosphor-icons/react";
import { useI18n } from "@/i18n/provider";
import { activeMatches, headToHead, newestFirst } from "@/lib/stats";
import type { Data } from "@/lib/types";
import { EmptyState, MatchRow, PageHeader } from "./ui";

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23888' stroke-width='1.8'/%3E%3C/svg%3E\")";

export function H2HView({ data }: { data: Data }) {
  const { d } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const players = useMemo(() => new Map(data.players.map((p) => [p.id, p])), [data.players]);
  const sorted = useMemo(
    () => [...data.players].sort((a, b) => a.name.localeCompare(b.name, "sv")),
    [data.players],
  );

  // With no players chosen, default to the pair from the most recent game.
  const latest = useMemo(() => newestFirst(activeMatches(data))[0], [data]);
  const noChoice = !params.has("a") && !params.has("b");
  const pa = noChoice ? latest?.p1 : params.get("a");
  const pb = noChoice ? latest?.p2 : params.get("b");
  const a = pa && players.has(pa) ? pa : "";
  const b = pb && players.has(pb) ? pb : "";
  const ready = a && b && a !== b;
  const h = useMemo(() => (ready ? headToHead(data, a, b) : null), [data, a, b, ready]);

  const set = (next: { a?: string; b?: string }) => {
    const q = new URLSearchParams();
    const na = next.a ?? a;
    const nb = next.b ?? b;
    if (na) q.set("a", na);
    if (nb) q.set("b", nb);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  const select =
    "min-h-12 w-full appearance-none rounded-box border border-line bg-surface bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat px-3 pr-9 text-base font-medium";

  const picker = (id: "a" | "b", value: string, other: string, label: string) => (
    <div className="min-w-0">
      <label htmlFor={`h2h-${id}`} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <select
        id={`h2h-${id}`}
        value={value}
        onChange={(e) => set({ [id]: e.target.value })}
        className={select}
        style={{ backgroundImage: CHEVRON }}
      >
        <option value="">-</option>
        {sorted.map((p) => (
          <option key={p.id} value={p.id} disabled={p.id === other}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );

  const nameA = players.get(a)?.name ?? "";
  const nameB = players.get(b)?.name ?? "";

  return (
    <div className="enter">
      <PageHeader title={d.h2h.title} />

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
        {picker("a", a, b, d.h2h.playerA)}
        <button
          type="button"
          onClick={() => set({ a: b, b: a })}
          disabled={!a && !b}
          aria-label={d.h2h.swap}
          className="grid size-12 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40"
        >
          <ArrowsLeftRight size={20} aria-hidden />
        </button>
        {picker("b", b, a, d.h2h.playerB)}
      </div>

      <div className="mt-8">
        {!h ? (
          <EmptyState>{d.h2h.choose}</EmptyState>
        ) : h.matches.length === 0 ? (
          <EmptyState>{d.h2h.noGames}</EmptyState>
        ) : (
          <>
            <section
              aria-label={d.h2h.wins}
              className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 border-y border-line py-8"
            >
              <div className="min-w-0 text-right">
                <p className="truncate font-medium">{nameA}</p>
              </div>
              <p className="num flex items-baseline gap-3 text-6xl font-semibold tracking-tight">
                <span className={h.winsA >= h.winsB ? "" : "text-muted"}>{h.winsA}</span>
                <span className="text-3xl text-muted" aria-hidden>
                  -
                </span>
                <span className={h.winsB >= h.winsA ? "" : "text-muted"}>{h.winsB}</span>
              </p>
              <div className="min-w-0">
                <p className="truncate font-medium">{nameB}</p>
              </div>
            </section>

            <dl className="grid grid-cols-2 gap-6 py-6">
              <div>
                <dt className="text-sm text-muted">{d.h2h.points}</dt>
                <dd className="num mt-1 text-2xl font-semibold">
                  {h.pointsA} <span className="text-muted">-</span> {h.pointsB}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">{d.h2h.games}</dt>
                <dd className="num mt-1 text-2xl font-semibold">{h.matches.length}</dd>
              </div>
            </dl>

            <ul className="divide-y divide-line/70">
              {h.matches.map((m) => (
                <MatchRow key={m.id} match={m} players={players} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
