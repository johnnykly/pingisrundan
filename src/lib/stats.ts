import type { Data, Match, Player } from "./types";

export const MIN_GAMES = 3;

export type Result = "W" | "L";

export interface Streak {
  type: Result | null;
  count: number;
}

export interface PlayerStats {
  id: string;
  name: string;
  played: number;
  wins: number;
  losses: number;
  /** 0..100, null when no games */
  winPct: number | null;
  pointsFor: number;
  pointsAgainst: number;
  /** Average point difference per game (signed), null when no games */
  avgDiff: number | null;
  current: Streak;
  longestWin: number;
  currentWin: number;
  /** Last 5 results, oldest first (most recent last) */
  form: Result[];
  qualified: boolean;
}

export interface HeadToHead {
  a: string;
  b: string;
  winsA: number;
  winsB: number;
  pointsA: number;
  pointsB: number;
  /** Most recent first */
  matches: Match[];
}

/** Chronological order: date, then creation time. */
export function chronological(matches: Match[]): Match[] {
  return [...matches].sort(
    (x, y) => x.date.localeCompare(y.date) || x.createdAt.localeCompare(y.createdAt),
  );
}

export function newestFirst(matches: Match[]): Match[] {
  return chronological(matches).reverse();
}

export function activeMatches(data: Data): Match[] {
  return data.matches.filter((m) => !m.deleted);
}

function sideOf(m: Match, playerId: string): 1 | 2 | null {
  if (m.p1 === playerId) return 1;
  if (m.p2 === playerId) return 2;
  return null;
}

export function playerStats(player: Player, matches: Match[]): PlayerStats {
  const games = chronological(matches).filter((m) => sideOf(m, player.id) !== null);
  let wins = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;
  let longestWin = 0;
  let run = 0;
  const results: Result[] = [];

  for (const m of games) {
    const side = sideOf(m, player.id)!;
    const mine = side === 1 ? m.s1 : m.s2;
    const theirs = side === 1 ? m.s2 : m.s1;
    pointsFor += mine;
    pointsAgainst += theirs;
    const won = m.winner === player.id;
    results.push(won ? "W" : "L");
    if (won) {
      wins++;
      run++;
      longestWin = Math.max(longestWin, run);
    } else {
      run = 0;
    }
  }

  const current: Streak = { type: null, count: 0 };
  for (let i = results.length - 1; i >= 0; i--) {
    if (current.type === null) current.type = results[i];
    if (results[i] !== current.type) break;
    current.count++;
  }

  const played = games.length;
  return {
    id: player.id,
    name: player.name,
    played,
    wins,
    losses: played - wins,
    winPct: played ? (wins / played) * 100 : null,
    pointsFor,
    pointsAgainst,
    avgDiff: played ? (pointsFor - pointsAgainst) / played : null,
    current,
    currentWin: current.type === "W" ? current.count : 0,
    longestWin,
    form: results.slice(-5),
    qualified: played >= MIN_GAMES,
  };
}

export type SortKey = "winPct" | "wins" | "losses" | "played" | "streak" | "name";

function streakValue(s: PlayerStats): number {
  if (!s.current.type) return 0;
  return s.current.type === "W" ? s.current.count : -s.current.count;
}

/**
 * Leaderboard. Players with fewer than MIN_GAMES games are listed after qualified
 * players when sorting by win %, so a single lucky win does not top the table.
 */
export function leaderboard(
  data: Data,
  sort: SortKey = "winPct",
  dir: "desc" | "asc" = "desc",
): PlayerStats[] {
  const matches = activeMatches(data);
  const rows = data.players.map((p) => playerStats(p, matches));
  const sign = dir === "desc" ? 1 : -1;

  const value = (s: PlayerStats): number => {
    switch (sort) {
      case "winPct":
        return s.winPct ?? -1;
      case "wins":
        return s.wins;
      case "losses":
        return s.losses;
      case "played":
        return s.played;
      case "streak":
        return streakValue(s);
      default:
        return 0;
    }
  };

  return rows.sort((x, y) => {
    if (sort === "winPct" && x.qualified !== y.qualified) return x.qualified ? -1 : 1;
    if (sort === "name") return -sign * x.name.localeCompare(y.name, "sv");
    const diff = sign * (value(y) - value(x));
    if (diff !== 0) return diff;
    // Tie-breakers: more wins, more games, then name.
    return y.wins - x.wins || y.played - x.played || x.name.localeCompare(y.name, "sv");
  });
}

export function headToHead(data: Data, a: string, b: string): HeadToHead {
  const matches = newestFirst(
    activeMatches(data).filter(
      (m) => (m.p1 === a && m.p2 === b) || (m.p1 === b && m.p2 === a),
    ),
  );
  let winsA = 0;
  let pointsA = 0;
  let pointsB = 0;
  for (const m of matches) {
    if (m.winner === a) winsA++;
    pointsA += m.p1 === a ? m.s1 : m.s2;
    pointsB += m.p1 === b ? m.s1 : m.s2;
  }
  return { a, b, winsA, winsB: matches.length - winsA, pointsA, pointsB, matches };
}

/** Head-to-head summary against every opponent the player has faced. */
export function opponents(data: Data, playerId: string): HeadToHead[] {
  const ids = new Set<string>();
  for (const m of activeMatches(data)) {
    if (m.p1 === playerId) ids.add(m.p2);
    if (m.p2 === playerId) ids.add(m.p1);
  }
  return [...ids]
    .map((id) => headToHead(data, playerId, id))
    .sort((x, y) => y.matches.length - x.matches.length);
}

/** Players ordered by most recent activity, then name. Used for quick picking. */
export function playersByRecency(data: Data): Player[] {
  const last = new Map<string, string>();
  for (const m of chronological(activeMatches(data))) {
    const key = `${m.date}|${m.createdAt}`;
    last.set(m.p1, key);
    last.set(m.p2, key);
  }
  return [...data.players].sort((x, y) => {
    const lx = last.get(x.id) ?? "";
    const ly = last.get(y.id) ?? "";
    return ly.localeCompare(lx) || x.name.localeCompare(y.name, "sv");
  });
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function nameKey(name: string): string {
  return normalizeName(name).toLocaleLowerCase("sv");
}
