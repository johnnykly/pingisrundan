import { describe, expect, it } from "vitest";
import { headToHead, leaderboard, nameKey, opponents, playerStats } from "@/lib/stats";
import type { Data, Match } from "@/lib/types";

let seq = 0;
function m(date: string, p1: string, s1: number, p2: string, s2: number, deleted = false): Match {
  seq++;
  return {
    id: `m_${seq}`,
    date,
    type: 11,
    p1,
    s1,
    p2,
    s2,
    winner: s1 > s2 ? p1 : p2,
    createdAt: `2026-01-01T00:00:${String(seq).padStart(2, "0")}.000Z`,
    deleted,
  };
}

const data: Data = {
  players: [
    { id: "a", name: "Anna", createdAt: "" },
    { id: "b", name: "Bo", createdAt: "" },
    { id: "c", name: "Cia", createdAt: "" },
  ],
  matches: [
    m("2026-10-01", "a", 11, "b", 5),
    m("2026-10-02", "a", 11, "b", 9),
    m("2026-10-03", "b", 11, "a", 7),
    m("2026-10-04", "a", 13, "b", 11),
    m("2026-10-05", "a", 11, "b", 3),
    m("2026-10-06", "a", 11, "c", 2),
    m("2026-10-07", "c", 11, "a", 0, true), // deleted, ignored
    m("2026-10-08", "c", 11, "b", 9),
  ],
};

const active = data.matches.filter((x) => !x.deleted);

describe("playerStats", () => {
  it("computes record, streaks, points and form", () => {
    const s = playerStats(data.players[0], active);
    expect(s.played).toBe(6);
    expect(s.wins).toBe(5);
    expect(s.losses).toBe(1);
    expect(s.winPct).toBeCloseTo(83.33, 1);
    expect(s.current).toEqual({ type: "W", count: 3 });
    expect(s.longestWin).toBe(3);
    expect(s.form).toEqual(["W", "L", "W", "W", "W"]);
    expect(s.pointsFor).toBe(11 + 11 + 7 + 13 + 11 + 11);
    expect(s.pointsAgainst).toBe(5 + 9 + 11 + 11 + 3 + 2);
    expect(s.avgDiff).toBeCloseTo((64 - 41) / 6);
  });

  it("tracks losing streaks", () => {
    const s = playerStats(data.players[1], active);
    expect(s.current).toEqual({ type: "L", count: 3 });
    expect(s.currentWin).toBe(0);
    expect(s.longestWin).toBe(1);
  });

  it("handles players without games", () => {
    const s = playerStats({ id: "z", name: "Z", createdAt: "" }, active);
    expect(s.winPct).toBeNull();
    expect(s.current.type).toBeNull();
    expect(s.form).toEqual([]);
  });
});

describe("leaderboard", () => {
  it("ranks qualified players first by win %", () => {
    const rows = leaderboard(data);
    // Cia is 2-0 but below the minimum game threshold.
    expect(rows.map((r) => r.id)).toEqual(["a", "b", "c"]);
    expect(rows[2].qualified).toBe(false);
  });

  it("sorts by other columns", () => {
    expect(leaderboard(data, "losses")[0].id).toBe("b");
    expect(leaderboard(data, "name", "asc").map((r) => r.name)).toEqual(["Anna", "Bo", "Cia"]);
  });
});

describe("headToHead", () => {
  it("summarises games between two players, newest first", () => {
    const h = headToHead(data, "a", "b");
    expect(h.winsA).toBe(4);
    expect(h.winsB).toBe(1);
    expect(h.matches[0].date).toBe("2026-10-05");
    expect(h.pointsA).toBe(11 + 11 + 7 + 13 + 11);
  });

  it("ignores deleted games", () => {
    expect(headToHead(data, "a", "c").matches).toHaveLength(1);
  });

  it("lists opponents", () => {
    expect(opponents(data, "a").map((h) => h.b)).toEqual(["b", "c"]);
  });
});

describe("nameKey", () => {
  it("is case and whitespace insensitive", () => {
    expect(nameKey("  johnny   LY ")).toBe(nameKey("Johnny Ly"));
    expect(nameKey("Åsa")).toBe(nameKey("åsa"));
  });
});
