"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Trash } from "@phosphor-icons/react";
import { setMatchDeleted } from "@/app/actions";
import { fmt } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import { formatDate } from "@/lib/date";
import { newestFirst } from "@/lib/stats";
import type { Data, Match } from "@/lib/types";
import { useToast } from "./toast";
import { EmptyState, MatchRow, PageHeader, plural } from "./ui";

export function HistoryView({ data }: { data: Data }) {
  const { d } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const [, startTransition] = useTransition();
  // Optimistic hidden/restored state, keyed by match id.
  const [override, setOverride] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState<Match | null>(null);

  const player = params.get("spelare") ?? "";
  const type = params.get("typ") ?? "";

  const players = useMemo(() => new Map(data.players.map((p) => [p.id, p])), [data.players]);
  const sortedPlayers = useMemo(
    () => [...data.players].sort((a, b) => a.name.localeCompare(b.name, "sv")),
    [data.players],
  );

  const matches = useMemo(
    () =>
      newestFirst(data.matches).filter((m) => {
        const deleted = override[m.id] ?? m.deleted;
        if (deleted) return false;
        if (player && m.p1 !== player && m.p2 !== player) return false;
        if (type && String(m.type) !== type) return false;
        return true;
      }),
    [data.matches, override, player, type],
  );

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const apply = (m: Match, deleted: boolean) => {
    setOverride((o) => ({ ...o, [m.id]: deleted }));
    startTransition(async () => {
      const res = await setMatchDeleted(m.id, deleted).catch(() => ({
        ok: false as const,
        error: "server" as const,
      }));
      if (!res.ok) {
        setOverride((o) => ({ ...o, [m.id]: !deleted }));
        toast({ message: d.errors[res.error], tone: "error" });
        return;
      }
      router.refresh();
      if (deleted) {
        toast({
          message: d.history.deleted,
          action: { label: d.history.undo, onClick: () => apply(m, false) },
          duration: 8000,
        });
      } else {
        toast({ message: d.history.restored, duration: 3000 });
      }
    });
  };

  const select =
    "min-h-11 w-full rounded-box border border-line bg-surface px-3 text-base appearance-none bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9";

  return (
    <div className="enter">
      <PageHeader title={d.history.title}>
        <p className="text-sm text-muted" aria-live="polite">
          {plural(matches.length, d.history.countOne, d.history.count)}
        </p>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="f-player" className="mb-1.5 block text-sm font-medium">
            {d.history.player}
          </label>
          <select
            id="f-player"
            value={player}
            onChange={(e) => setFilter("spelare", e.target.value)}
            className={select}
            style={{ backgroundImage: CHEVRON }}
          >
            <option value="">{d.history.allPlayers}</option>
            {sortedPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-type" className="mb-1.5 block text-sm font-medium">
            {d.history.type}
          </label>
          <select
            id="f-type"
            value={type}
            onChange={(e) => setFilter("typ", e.target.value)}
            className={select}
            style={{ backgroundImage: CHEVRON }}
          >
            <option value="">{d.history.allTypes}</option>
            <option value="11">{fmt(d.match.to, { n: 11 })}</option>
            <option value="21">{fmt(d.match.to, { n: 21 })}</option>
          </select>
        </div>
      </div>

      {matches.length === 0 ? (
        <EmptyState>{d.history.empty}</EmptyState>
      ) : (
        <ul className="divide-y divide-line/70">
          {matches.map((m) => (
            <MatchRow
              key={m.id}
              match={m}
              players={players}
              highlight={player || undefined}
              action={
                <button
                  type="button"
                  onClick={() => setConfirm(m)}
                  aria-label={fmt(d.history.deleteMatch, {
                    a: players.get(m.p1)?.name ?? "",
                    b: players.get(m.p2)?.name ?? "",
                  })}
                  className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-danger"
                >
                  <Trash size={20} aria-hidden />
                </button>
              }
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        match={confirm}
        names={(id) => players.get(id)?.name ?? "?"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) apply(confirm, true);
          setConfirm(null);
        }}
      />
    </div>
  );
}

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23888' stroke-width='1.8'/%3E%3C/svg%3E\")";

function ConfirmDialog({
  match,
  names,
  onCancel,
  onConfirm,
}: {
  match: Match | null;
  names: (id: string) => string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { d } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (match && !el.open) el.showModal();
    if (!match && el.open) el.close();
  }, [match]);

  return (
    <dialog
      ref={ref}
      onClose={onCancel}
      onClick={(e) => e.target === ref.current && onCancel()}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-box border border-line bg-surface p-0 text-ink backdrop:bg-[rgb(23_22_23/0.5)]"
    >
      {match && (
        <div className="p-6">
          <h2 id="confirm-title" className="text-xl font-semibold tracking-tight">
            {d.history.confirmTitle}
          </h2>
          <p className="mt-2 text-muted">
            {fmt(d.history.confirmBody, {
              a: names(match.p1),
              b: names(match.p2),
              s1: match.s1,
              s2: match.s2,
              date: formatDate(match.date, d.locale),
            })}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              autoFocus
              className="min-h-11 rounded-full px-5 font-semibold hover:bg-surface-2"
            >
              {d.history.cancel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="min-h-11 rounded-full bg-danger px-5 font-semibold text-surface"
            >
              {d.history.confirm}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
