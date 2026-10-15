"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { fmt } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import { leaderboard, MIN_GAMES, type SortKey } from "@/lib/stats";
import type { Data } from "@/lib/types";
import { FormBadges, StreakLabel } from "./ui";

export function Leaderboard({ data }: { data: Data }) {
  const { d, lang } = useI18n();
  const [sort, setSort] = useState<SortKey>("winPct");
  const [dir, setDir] = useState<"desc" | "asc">("desc");
  const rows = useMemo(() => leaderboard(data, sort, dir), [data, sort, dir]);
  const pct = useMemo(
    () => new Intl.NumberFormat(d.locale, { maximumFractionDigits: 0 }),
    [d.locale],
  );

  const toggle = (key: SortKey) => {
    if (key === sort) setDir(dir === "desc" ? "asc" : "desc");
    else {
      setSort(key);
      setDir(key === "name" || key === "losses" ? "asc" : "desc");
    }
  };

  const cols: { key: SortKey; label: string; long: string; className?: string }[] = [
    { key: "wins", label: d.board.wins, long: d.board.winsLong },
    { key: "losses", label: d.board.losses, long: d.board.lossesLong },
    { key: "winPct", label: d.board.winPct, long: d.board.winPct },
    { key: "played", label: d.board.played, long: d.board.playedLong },
    { key: "streak", label: d.board.streak, long: d.board.streak },
  ];

  const header = (key: SortKey, label: string, long: string, align: "left" | "right", className = "") => {
    const active = sort === key;
    return (
      <th
        key={key}
        scope="col"
        aria-sort={active ? (dir === "desc" ? "descending" : "ascending") : "none"}
        className={`p-0 font-medium ${className}`}
      >
        <button
          type="button"
          onClick={() => toggle(key)}
          title={fmt(d.board.sortBy, { col: long })}
          className={`flex min-h-11 w-full items-center gap-0.5 px-1.5 text-xs uppercase tracking-wide ${
            align === "right" ? "justify-end" : "justify-start"
          } ${active ? "text-ink" : "text-muted hover:text-ink"}`}
        >
          <span aria-hidden={label !== long}>{label}</span>
          {label !== long && <span className="sr-only">{long}</span>}
          {active &&
            (dir === "desc" ? (
              <CaretDown size={12} weight="bold" aria-hidden />
            ) : (
              <CaretUp size={12} weight="bold" aria-hidden />
            ))}
        </button>
      </th>
    );
  };

  let rank = 0;
  return (
    <div>
      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full border-collapse text-left" lang={lang}>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="w-8 px-1 text-xs font-medium text-muted">
                <span className="sr-only">#</span>
              </th>
              {header("name", d.board.player, d.board.player, "left")}
              {cols.map((c) => header(c.key, c.label, c.long, "right", c.className))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const showRank = sort === "winPct" && dir === "desc" ? r.qualified : true;
              if (showRank) rank++;
              const leader = sort === "winPct" && dir === "desc" && rank === 1 && r.qualified;
              return (
                <tr key={r.id} className="border-b border-line/70 last:border-0">
                  <td className="num px-1 py-3 text-sm text-muted">
                    {showRank ? (
                      <span
                        className={
                          leader
                            ? "inline-grid size-6 place-items-center rounded-full bg-accent font-semibold text-accent-ink"
                            : ""
                        }
                      >
                        {rank}
                      </span>
                    ) : (
                      <span title={d.board.unranked}>-</span>
                    )}
                  </td>
                  <td className="max-w-[9rem] px-1.5 py-3">
                    <Link href={`/spelare/${r.id}`} className="block truncate font-medium hover:underline">
                      {r.name}
                    </Link>
                    {r.form.length > 0 && (
                      <span className="mt-1.5 block">
                        <FormBadges form={r.form} size="sm" />
                      </span>
                    )}
                  </td>
                  <td className="num px-1.5 py-3 text-right">{r.wins}</td>
                  <td className="num px-1.5 py-3 text-right text-muted">{r.losses}</td>
                  <td className="num px-1.5 py-3 text-right font-semibold">
                    {r.winPct == null ? <span className="font-normal text-muted">-</span> : pct.format(r.winPct)}
                  </td>
                  <td className="num px-1.5 py-3 text-right text-muted">{r.played}</td>
                  <td className="px-1.5 py-3 text-right text-sm">
                    <StreakLabel streak={r.current} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 max-w-[60ch] text-sm text-muted">{fmt(d.board.minGames, { n: MIN_GAMES })}</p>
    </div>
  );
}
