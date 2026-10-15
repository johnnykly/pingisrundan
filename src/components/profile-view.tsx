"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, CaretRight } from "@phosphor-icons/react";
import { useI18n } from "@/i18n/provider";
import { activeMatches, newestFirst, opponents, playerStats } from "@/lib/stats";
import type { Data } from "@/lib/types";
import { EmptyState, FormBadges, MatchRow, SectionTitle, StreakLabel } from "./ui";

export function ProfileView({ data, id }: { data: Data; id: string }) {
  const { d } = useI18n();
  const player = data.players.find((p) => p.id === id);
  const players = useMemo(() => new Map(data.players.map((p) => [p.id, p])), [data.players]);
  const matches = useMemo(() => activeMatches(data), [data]);
  const stats = useMemo(() => (player ? playerStats(player, matches) : null), [player, matches]);
  const vs = useMemo(() => (player ? opponents(data, player.id) : []), [data, player]);
  const recent = useMemo(
    () => newestFirst(matches.filter((m) => m.p1 === id || m.p2 === id)).slice(0, 10),
    [matches, id],
  );
  const nf = useMemo(
    () => ({
      pct: new Intl.NumberFormat(d.locale, { maximumFractionDigits: 0 }),
      diff: new Intl.NumberFormat(d.locale, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
        signDisplay: "exceptZero",
      }),
    }),
    [d.locale],
  );

  const back = (
    <Link
      href="/spelare"
      className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
    >
      <ArrowLeft size={14} aria-hidden />
      {d.profile.back}
    </Link>
  );

  if (!player || !stats) {
    return (
      <div className="enter">
        {back}
        <EmptyState>{d.profile.notFound}</EmptyState>
      </div>
    );
  }

  const stat = (label: string, value: React.ReactNode, hint?: string) => (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="num mt-1 text-3xl font-semibold tracking-tight">{value}</dd>
      {hint && <dd className="text-xs text-muted">{hint}</dd>}
    </div>
  );

  return (
    <div className="enter">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <h1 className="text-4xl font-semibold tracking-tight">{player.name}</h1>
        {stats.played > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{d.profile.form}</span>
            <FormBadges form={stats.form} />
          </div>
        )}
      </div>

      {stats.played === 0 ? (
        <div className="mt-8">
          <EmptyState>{d.profile.noGames}</EmptyState>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 py-8">
            {stat(
              d.profile.record,
              <>
                {stats.wins}
                <span className="text-muted">-</span>
                {stats.losses}
              </>,
            )}
            {stat(d.profile.winPct, stats.winPct == null ? "-" : nf.pct.format(stats.winPct))}
            {stat(d.profile.current, <StreakLabel streak={stats.current} />)}
            {stat(d.profile.longest, stats.longestWin)}
            {stat(
              d.profile.avgDiff,
              stats.avgDiff == null ? "-" : nf.diff.format(stats.avgDiff),
              d.profile.avgDiffHint,
            )}
            {stat(
              `${d.profile.pointsFor} / ${d.profile.pointsAgainst}`,
              <>
                {stats.pointsFor}
                <span className="text-muted"> / </span>
                {stats.pointsAgainst}
              </>,
            )}
          </dl>

          <div className="grid gap-12">
            <section aria-labelledby="vs">
              <SectionTitle id="vs">{d.profile.vs}</SectionTitle>
              <ul className="mt-2 divide-y divide-line/70">
                {vs.map((h) => {
                  const opp = players.get(h.b);
                  return (
                    <li key={h.b}>
                      <Link
                        href={`/h2h?a=${player.id}&b=${h.b}`}
                        className="group flex min-h-14 items-center gap-3 py-2"
                      >
                        <span className="min-w-0 flex-1 truncate font-medium group-hover:underline">
                          {opp?.name ?? "?"}
                        </span>
                        <span className="num text-sm text-muted">
                          {h.pointsA}-{h.pointsB}
                        </span>
                        <span className="num w-14 text-right text-lg font-semibold">
                          {h.winsA}
                          <span className="text-muted">-</span>
                          {h.winsB}
                        </span>
                        <CaretRight size={14} className="text-muted" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section aria-labelledby="games">
              <SectionTitle id="games">{d.profile.recent}</SectionTitle>
              <ul className="divide-y divide-line/70">
                {recent.map((m) => (
                  <MatchRow key={m.id} match={m} players={players} highlight={player.id} />
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
