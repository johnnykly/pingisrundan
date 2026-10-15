"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "@phosphor-icons/react";
import { useMemo } from "react";
import { useI18n } from "@/i18n/provider";
import { activeMatches, newestFirst, playerStats } from "@/lib/stats";
import type { Data } from "@/lib/types";
import { Leaderboard } from "./leaderboard";
import { EmptyState, MatchRow, PageHeader, SectionTitle } from "./ui";

export function HomeView({ data }: { data: Data }) {
  const { d } = useI18n();
  const players = useMemo(() => new Map(data.players.map((p) => [p.id, p])), [data.players]);
  const matches = useMemo(() => activeMatches(data), [data]);
  const recent = useMemo(() => newestFirst(matches).slice(0, 5), [matches]);
  const streaks = useMemo(
    () =>
      data.players
        .map((p) => playerStats(p, matches))
        .filter((s) => s.played > 0)
        .sort((a, b) => b.currentWin - a.currentWin || b.longestWin - a.longestWin)
        .slice(0, 6),
    [data.players, matches],
  );

  return (
    <div className="enter">
      <PageHeader title={d.board.title} />

      {matches.length === 0 ? (
        <EmptyState>
          <p>{d.board.empty}</p>
          <Link
            href="/ny"
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent px-5 font-semibold text-accent-ink"
          >
            <Plus weight="bold" aria-hidden />
            {d.board.emptyCta}
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-16">
          <section aria-label={d.board.title}>
            <Leaderboard data={data} />
          </section>

          <div className="grid content-start gap-12">
            <section aria-labelledby="streaks">
              <SectionTitle id="streaks">{d.streak.title}</SectionTitle>
              <ul className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-5">
                <li className="col-span-3 grid grid-cols-subgrid border-b border-line pb-2 text-xs uppercase tracking-wide text-muted">
                  <span className="sr-only">{d.board.player}</span>
                  <span aria-hidden />
                  <span className="text-right">{d.streak.current}</span>
                  <span className="text-right">{d.streak.longest}</span>
                </li>
                {streaks.map((s) => (
                  <li key={s.id} className="col-span-3 grid grid-cols-subgrid items-center py-2.5">
                    <Link href={`/spelare/${s.id}`} className="truncate hover:underline">
                      {s.name}
                    </Link>
                    <span
                      className={`num text-right text-lg ${s.currentWin > 0 ? "font-semibold" : "text-muted"}`}
                    >
                      {s.currentWin}
                    </span>
                    <span className="num text-right text-lg text-muted">{s.longestWin}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="recent">
              <div className="flex items-center justify-between">
                <SectionTitle id="recent">{d.recent.title}</SectionTitle>
                <Link
                  href="/historik"
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted hover:text-ink"
                >
                  {d.recent.seeAll}
                  <ArrowRight size={14} aria-hidden />
                </Link>
              </div>
              <ul className="divide-y divide-line/70">
                {recent.map((m) => (
                  <MatchRow key={m.id} match={m} players={players} />
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
