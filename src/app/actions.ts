"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { DATA_TAG } from "@/lib/data";
import { isIsoDate, todayStockholm } from "@/lib/date";
import { isGameType, validateScore, type ScoreError } from "@/lib/rules";
import { nameKey, normalizeName } from "@/lib/stats";
import { ConfigError, getStore } from "@/lib/store";
import type { Match, Player } from "@/lib/types";

export type ActionError =
  | ScoreError
  | "same_player"
  | "unknown_player"
  | "invalid_date"
  | "future_date"
  | "invalid_type"
  | "name_empty"
  | "name_too_long"
  | "name_taken"
  | "not_found"
  | "config"
  | "server";

export type ActionResult<T> = { ok: true; value: T } | { ok: false; error: ActionError };

const ID_RE = /^[mp]_[a-z0-9]{6,32}$/;

function newId(prefix: "m" | "p"): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function refresh() {
  revalidateTag(DATA_TAG);
  revalidatePath("/", "layout");
}

function fail(e: unknown): { ok: false; error: ActionError } {
  console.error(e);
  return { ok: false, error: e instanceof ConfigError ? "config" : "server" };
}

export interface NewMatchInput {
  /** Client-generated id so a retried submit cannot create duplicates. */
  id?: string;
  date: string;
  type: number;
  p1: string;
  s1: number;
  p2: string;
  s2: number;
}

export async function addMatch(input: NewMatchInput): Promise<ActionResult<Match>> {
  const type = Number(input.type);
  if (!isGameType(type)) return { ok: false, error: "invalid_type" };
  if (!isIsoDate(input.date)) return { ok: false, error: "invalid_date" };
  if (input.date > todayStockholm()) return { ok: false, error: "future_date" };
  if (!input.p1 || !input.p2) return { ok: false, error: "incomplete" };
  if (input.p1 === input.p2) return { ok: false, error: "same_player" };

  const s1 = Number(input.s1);
  const s2 = Number(input.s2);
  const score = validateScore(type, s1, s2);
  if (!score.ok) return { ok: false, error: score.error };

  try {
    const store = getStore();
    const data = await store.read();
    const ids = new Set(data.players.map((p) => p.id));
    if (!ids.has(input.p1) || !ids.has(input.p2)) {
      return { ok: false, error: "unknown_player" };
    }

    const id = input.id && ID_RE.test(input.id) ? input.id : newId("m");
    const existing = data.matches.find((m) => m.id === id);
    if (existing) return { ok: true, value: existing };

    const match: Match = {
      id,
      date: input.date,
      type,
      p1: input.p1,
      s1,
      p2: input.p2,
      s2,
      winner: score.winner === 1 ? input.p1 : input.p2,
      createdAt: new Date().toISOString(),
      deleted: false,
    };
    await store.appendMatch(match);
    refresh();
    return { ok: true, value: match };
  } catch (e) {
    return fail(e);
  }
}

export async function addPlayer(rawName: string): Promise<ActionResult<Player>> {
  const name = normalizeName(String(rawName ?? ""));
  if (!name) return { ok: false, error: "name_empty" };
  if (name.length > 40) return { ok: false, error: "name_too_long" };

  try {
    const store = getStore();
    const data = await store.read();
    const key = nameKey(name);
    if (data.players.some((p) => nameKey(p.name) === key)) {
      return { ok: false, error: "name_taken" };
    }
    const player: Player = { id: newId("p"), name, createdAt: new Date().toISOString() };
    await store.appendPlayer(player);
    refresh();
    return { ok: true, value: player };
  } catch (e) {
    return fail(e);
  }
}

export async function setMatchDeleted(
  id: string,
  deleted: boolean,
): Promise<ActionResult<null>> {
  if (!ID_RE.test(id) && !/^m_[a-z0-9]+$/.test(id)) return { ok: false, error: "not_found" };
  try {
    const found = await getStore().setDeleted(id, deleted);
    if (!found) return { ok: false, error: "not_found" };
    refresh();
    return { ok: true, value: null };
  } catch (e) {
    return fail(e);
  }
}
