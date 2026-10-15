"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { CheckCircle, Minus, Plus, Trophy } from "@phosphor-icons/react";
import { addMatch, addPlayer, type ActionError } from "@/app/actions";
import { fmt } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import { GAME_TYPES, MAX_SCORE, validateScore } from "@/lib/rules";
import type { GameType, Player } from "@/lib/types";
import { PageHeader } from "./ui";

const LAST_PAIR_KEY = "pingis.lastPair";

function newMatchId() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return "m_" + Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

function parseScore(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
}

type Side = 1 | 2;

interface Saved {
  winner: string;
  score: string;
}

export function AddMatchForm({ players: initialPlayers, today }: { players: Player[]; today: string }) {
  const { d } = useI18n();
  const router = useRouter();
  const [players, setPlayers] = useState(initialPlayers);
  const [type, setType] = useState<GameType>(11);
  const [date, setDate] = useState(today);
  const [p, setP] = useState<Record<Side, string>>({ 1: "", 2: "" });
  const [s, setS] = useState<Record<Side, string>>({ 1: "", 2: "" });
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<ActionError | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [pending, startTransition] = useTransition();
  const matchId = useRef(newMatchId());
  const errorId = useId();

  // Keep server-provided players in sync (e.g. after router.refresh()).
  useEffect(() => {
    setPlayers((cur) => {
      const ids = new Set(initialPlayers.map((x) => x.id));
      return [...initialPlayers, ...cur.filter((x) => !ids.has(x.id))];
    });
  }, [initialPlayers]);

  // Prefill the last pair that played on this device.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_PAIR_KEY);
      if (!raw) return;
      const [a, b] = JSON.parse(raw) as [string, string];
      const ids = new Set(initialPlayers.map((x) => x.id));
      if (ids.has(a) && ids.has(b) && a !== b) setP({ 1: a, 2: b });
    } catch {}
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byId = useMemo(() => new Map(players.map((x) => [x.id, x])), [players]);
  const s1 = parseScore(s[1]);
  const s2 = parseScore(s[2]);
  const result = validateScore(type, s1, s2);
  const bothScores = s1 !== null && s2 !== null;
  const winnerSide: Side | null = result.ok ? result.winner : null;

  let error: ActionError | "pickPlayers" | null = null;
  if (p[1] && p[1] === p[2]) error = "same_player";
  else if (!result.ok && (bothScores || submitted)) error = result.error;
  else if (submitted && (!p[1] || !p[2])) error = "pickPlayers";
  else if (serverError) error = serverError;

  const errorText = error
    ? fmt(d.errors[error], { target: type })
    : null;

  const setScore = (side: Side, v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 2);
    setS((cur) => ({ ...cur, [side]: clean }));
    setServerError(null);
  };

  const step = (side: Side, delta: number) => {
    const cur = parseScore(s[side]);
    const base = cur === null || Number.isNaN(cur) ? 0 : cur;
    const next = Math.min(MAX_SCORE, Math.max(0, base + delta));
    setScore(side, String(cur === null && delta > 0 ? 1 : next));
  };

  const pick = (side: Side, id: string) => {
    setP((cur) => ({ ...cur, [side]: id }));
    setServerError(null);
  };

  const reset = () => {
    setS({ 1: "", 2: "" });
    setSubmitted(false);
    setServerError(null);
    setSaved(null);
    matchId.current = newMatchId();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!p[1] || !p[2] || p[1] === p[2] || !result.ok || pending) return;

    const winnerId = result.winner === 1 ? p[1] : p[2];
    const hi = Math.max(s1!, s2!);
    const lo = Math.min(s1!, s2!);
    // Optimistic: show success right away, roll back if the server rejects.
    setSaved({ winner: byId.get(winnerId)?.name ?? "", score: `${hi}-${lo}` });
    try {
      localStorage.setItem(LAST_PAIR_KEY, JSON.stringify([p[1], p[2]]));
    } catch {}

    startTransition(async () => {
      let res;
      try {
        res = await addMatch({
          id: matchId.current,
          date,
          type,
          p1: p[1],
          s1: s1!,
          p2: p[2],
          s2: s2!,
        });
      } catch {
        res = { ok: false as const, error: "server" as const };
      }
      if (!res.ok) {
        setSaved(null);
        setServerError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  if (saved) {
    return (
      <div className="enter" role="status" aria-live="polite">
        <div className="rounded-box border border-line bg-surface p-6">
          <CheckCircle size={40} weight="fill" className="text-accent" aria-hidden />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">{d.add.saved}</h1>
          <p className="mt-2 text-lg text-muted">
            {fmt(d.add.savedDetail, { winner: saved.winner, score: saved.score })}
          </p>
          {pending && <p className="mt-1 text-sm text-muted">{d.add.saving}</p>}
          <div className="mt-8 grid gap-3">
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              className="min-h-14 rounded-full bg-accent px-6 text-base font-semibold text-accent-ink active:scale-[0.98] disabled:opacity-60"
            >
              {d.add.addAnother}
            </button>
            <Link
              href="/"
              className="grid min-h-14 place-items-center rounded-full border border-line px-6 text-base font-semibold hover:bg-surface-2"
            >
              {d.add.viewStandings}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="enter">
      <PageHeader title={d.add.title} />

      <div className="mb-6 grid gap-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{d.add.type}</legend>
          <div className="grid grid-cols-2 rounded-full bg-surface-2 p-1">
            {GAME_TYPES.map((t) => (
              <label
                key={t}
                className={`grid min-h-11 cursor-pointer place-items-center rounded-full text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus)] ${
                  type === t ? "bg-ink text-bg" : "text-muted hover:text-ink"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={type === t}
                  onChange={() => {
                    setType(t);
                    setServerError(null);
                  }}
                  className="sr-only"
                />
                {fmt(d.add.typeOption, { n: t })}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{type === 11 ? d.add.rules11 : d.add.rules21}</p>
        </fieldset>

        <div>
          <label htmlFor="date" className="mb-2 block text-sm font-medium">
            {d.add.date}
          </label>
          <input
            id="date"
            type="date"
            value={date}
            max={today}
            required
            onChange={(e) => {
              setDate(e.target.value);
              setServerError(null);
            }}
            className="min-h-[3.25rem] w-full rounded-box border border-line bg-surface px-4 text-base"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {([1, 2] as const).map((side) => {
          const other: Side = side === 1 ? 2 : 1;
          const isWinner = winnerSide === side;
          const playerName = byId.get(p[side])?.name;
          return (
            <fieldset
              key={side}
              className={`rounded-box border bg-surface p-4 transition-colors ${
                isWinner ? "border-accent ring-1 ring-accent" : "border-line"
              }`}
            >
              <legend className="sr-only">{side === 1 ? d.add.player1 : d.add.player2}</legend>
              <div className="mb-3 flex min-h-7 items-center justify-between">
                <span className="text-sm font-medium" aria-hidden>
                  {side === 1 ? d.add.player1 : d.add.player2}
                </span>
                {isWinner && (
                  <span className="enter inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-ink">
                    <Trophy weight="fill" aria-hidden />
                    {d.add.winner}
                  </span>
                )}
              </div>

              <PlayerPicker
                side={side}
                players={players}
                value={p[side]}
                taken={p[other]}
                onPick={(id) => pick(side, id)}
                onCreated={(pl) => {
                  setPlayers((cur) => [...cur, pl]);
                  pick(side, pl.id);
                  router.refresh();
                }}
              />

              <ScoreStepper
                id={`score-${side}`}
                label={playerName ? fmt(d.add.pointsFor, { name: playerName }) : d.add.points}
                value={s[side]}
                onChange={(v) => setScore(side, v)}
                onStep={(delta) => step(side, delta)}
                invalid={!!error && bothScores && !result.ok}
                describedBy={errorText ? errorId : undefined}
              />
            </fieldset>
          );
        })}
      </div>

      <div className="mt-4 min-h-6" aria-live="polite">
        {errorText && (
          <p id={errorId} className="text-sm font-medium text-danger">
            {errorText}
          </p>
        )}
      </div>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-2 bg-gradient-to-t from-bg via-bg to-bg/0 px-4 pb-3 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="min-h-14 w-full rounded-full bg-accent px-6 text-lg font-semibold text-accent-ink transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? d.add.saving : d.add.save}
        </button>
      </div>
    </form>
  );
}

function ScoreStepper({
  id,
  label,
  value,
  onChange,
  onStep,
  invalid,
  describedBy,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onStep: (delta: number) => void;
  invalid: boolean;
  describedBy?: string;
}) {
  const { d } = useI18n();
  const btn =
    "grid size-14 shrink-0 place-items-center rounded-full border border-line bg-bg text-ink transition-transform active:scale-95 hover:bg-surface-2";
  return (
    <div className="mt-5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex items-center justify-between gap-3">
        <button type="button" className={btn} onClick={() => onStep(-1)} aria-label={`${d.add.decrease}: ${label}`}>
          <Minus size={22} weight="bold" aria-hidden />
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="num h-20 w-full min-w-0 rounded-box bg-transparent text-center text-6xl font-semibold tracking-tight placeholder:text-line focus:bg-surface-2"
        />
        <button type="button" className={btn} onClick={() => onStep(1)} aria-label={`${d.add.increase}: ${label}`}>
          <Plus size={22} weight="bold" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function PlayerPicker({
  side,
  players,
  value,
  taken,
  onPick,
  onCreated,
}: {
  side: Side;
  players: Player[];
  value: string;
  taken: string;
  onPick: (id: string) => void;
  onCreated: (p: Player) => void;
}) {
  const { d } = useI18n();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState<ActionError | null>(null);
  const [pending, start] = useTransition();
  const inputId = useId();
  const errId = useId();

  const create = () => {
    start(async () => {
      const res = await addPlayer(name);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setName("");
      setErr(null);
      setAdding(false);
      onCreated(res.value);
    });
  };

  const chip = "min-h-11 rounded-full border px-4 text-[0.95rem] font-medium transition-colors";

  return (
    <div>
      <div role="radiogroup" aria-label={side === 1 ? d.add.player1 : d.add.player2} className="flex flex-wrap gap-2">
        {players.map((pl) => {
          const selected = value === pl.id;
          const disabled = taken === pl.id;
          return (
            <button
              key={pl.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-disabled={disabled || undefined}
              title={disabled ? d.add.takenOtherSide : undefined}
              onClick={() => !disabled && onPick(pl.id)}
              className={`${chip} ${
                selected
                  ? "border-ink bg-ink text-bg"
                  : disabled
                    ? "cursor-not-allowed border-line text-muted line-through opacity-50"
                    : "border-line hover:border-ink"
              }`}
            >
              {pl.name}
            </button>
          );
        })}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={`${chip} inline-flex items-center gap-1 border-dashed border-line text-muted hover:border-ink hover:text-ink`}
          >
            <Plus size={14} weight="bold" aria-hidden />
            {d.add.newPlayer}
          </button>
        )}
      </div>

      {adding && (
        <div className="enter mt-3">
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
            {d.add.newPlayerName}
          </label>
          <div className="flex gap-2">
            <input
              id={inputId}
              autoFocus
              value={name}
              maxLength={40}
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="done"
              onChange={(e) => {
                setName(e.target.value);
                setErr(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  create();
                }
                if (e.key === "Escape") setAdding(false);
              }}
              aria-invalid={!!err || undefined}
              aria-describedby={err ? errId : undefined}
              className="min-h-11 min-w-0 flex-1 rounded-box border border-line bg-bg px-3 text-base"
            />
            <button
              type="button"
              onClick={create}
              disabled={pending}
              className="min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-bg disabled:opacity-60"
            >
              {d.add.addPlayer}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setErr(null);
              }}
              className="min-h-11 rounded-full px-3 text-sm font-medium text-muted hover:text-ink"
            >
              {d.add.cancel}
            </button>
          </div>
          {err && (
            <p id={errId} className="mt-1.5 text-sm font-medium text-danger" role="alert">
              {d.errors[err]}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
