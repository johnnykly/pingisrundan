"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { fmt } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import { formatDate } from "@/lib/date";
import type { Result, Streak } from "@/lib/stats";
import type { Match, Player } from "@/lib/types";

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 md:mb-8">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      {children}
    </div>
  );
}

export function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-lg font-semibold tracking-tight">
      {children}
    </h2>
  );
}

export function LoadError({ error }: { error: "config" | "loadFailed" }) {
  const { d } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="rounded-box border border-line bg-surface p-6" role="alert">
      <p className="font-medium">{d.errors[error]}</p>
      {error === "config" ? (
        <p className="mt-2 text-sm text-muted">
          GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID
        </p>
      ) : (
        <button
          type="button"
          onClick={() => start(() => router.refresh())}
          disabled={pending}
          className="mt-4 min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-bg disabled:opacity-60"
        >
          {d.errors.retry}
        </button>
      )}
    </div>
  );
}

export function FormDots({ form, size = "md" }: { form: Result[]; size?: "sm" | "md" }) {
  const { d } = useI18n();
  const dim = size === "sm" ? "size-2.5" : "size-3.5";
  if (!form.length) return <span className="text-sm text-muted">-</span>;
  const label = form.map((r) => (r === "W" ? d.profile.formWin : d.profile.formLoss)).join(", ");
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`${d.profile.form}: ${label}`}>
      {form.map((r, i) => (
        <span
          key={i}
          className={`${dim} rounded-full ${
            r === "W" ? "border-[1.5px] border-accent-edge bg-accent" : "border-[1.5px] border-muted bg-transparent"
          }`}
        />
      ))}
    </span>
  );
}

export function StreakLabel({ streak }: { streak: Streak }) {
  const { d } = useI18n();
  if (!streak.type) return <span className="text-muted">-</span>;
  const win = streak.type === "W";
  return (
    <span className={`num font-semibold ${win ? "text-ink" : "text-muted"}`}>
      {win ? d.streak.win : d.streak.loss}
      {streak.count}
    </span>
  );
}

export function plural(n: number, one: string, many: string) {
  return n === 1 ? one : fmt(many, { n });
}

export function MatchRow({
  match,
  players,
  action,
  highlight,
}: {
  match: Match;
  players: Map<string, Player>;
  action?: React.ReactNode;
  /** Player whose perspective to show (bolds their name). */
  highlight?: string;
}) {
  const { d } = useI18n();
  const name = (id: string) => players.get(id)?.name ?? "?";
  const w1 = match.winner === match.p1;
  const cell = (id: string, won: boolean, align: "left" | "right") => (
    <Link
      href={`/spelare/${id}`}
      className={`min-w-0 truncate py-1 hover:underline ${align === "right" ? "text-right" : ""} ${
        won ? "font-semibold text-ink" : "text-muted"
      } ${highlight === id ? "underline decoration-accent decoration-2 underline-offset-4" : ""}`}
    >
      {name(id)}
    </Link>
  );

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 text-xs text-muted">
          <time dateTime={match.date}>{formatDate(match.date, d.locale)}</time>
          {match.type === 21 && (
            <span className="rounded-full border border-line px-2 py-px font-medium">
              {fmt(d.match.to, { n: 21 })}
            </span>
          )}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-[0.95rem]">
          {cell(match.p1, w1, "right")}
          <span className="num grid grid-cols-[1.6rem_auto_1.6rem] items-center gap-1 text-base">
            <span className={`text-right ${w1 ? "font-semibold" : "text-muted"}`}>{match.s1}</span>
            <span className="text-muted" aria-hidden>
              -
            </span>
            <span className={!w1 ? "font-semibold" : "text-muted"}>{match.s2}</span>
          </span>
          {cell(match.p2, !w1, "left")}
        </div>
      </div>
      {action}
    </li>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-box border border-dashed border-line px-6 py-10 text-center text-muted">
      {children}
    </div>
  );
}
