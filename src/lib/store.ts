import "server-only";
import { sheets as sheetsApi, auth, type sheets_v4 } from "@googleapis/sheets";
import type { Data, Match, Player } from "./types";

/**
 * Data access for the Google Sheet. All reads and writes happen server-side
 * through a service account; credentials never reach the client.
 *
 * Set PINGIS_MOCK=1 to use an in-memory store (local development and tests).
 */

export const PLAYERS_TAB = "Spelare";
export const MATCHES_TAB = "Matcher";

export class ConfigError extends Error {}

export interface Store {
  read(): Promise<Data>;
  appendPlayer(p: Player): Promise<void>;
  appendMatch(m: Match): Promise<void>;
  setDeleted(matchId: string, deleted: boolean): Promise<boolean>;
}

/* ---------- Row mapping ---------- */

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function num(v: unknown): number {
  const n = Number(str(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function bool(v: unknown): boolean {
  const s = str(v).toUpperCase();
  return s === "TRUE" || s === "SANT" || s === "1" || s === "JA";
}

export function rowToPlayer(r: unknown[]): Player | null {
  const id = str(r[0]);
  const name = str(r[1]);
  if (!id || !name) return null;
  return { id, name, createdAt: str(r[2]) };
}

/** Accepts "YYYY-MM-DD" or a Sheets date serial (if someone edits the cell by hand). */
function dateCell(v: unknown): string {
  if (typeof v === "number") {
    const ms = Math.round((v - 25569) * 86400 * 1000);
    return new Date(ms).toISOString().slice(0, 10);
  }
  return str(v).slice(0, 10);
}

export function rowToMatch(r: unknown[]): Match | null {
  const id = str(r[0]);
  if (!id) return null;
  const type = num(r[2]) === 21 ? 21 : 11;
  const m: Match = {
    id,
    date: dateCell(r[1]),
    type,
    p1: str(r[3]),
    s1: num(r[4]),
    p2: str(r[5]),
    s2: num(r[6]),
    winner: str(r[7]),
    createdAt: str(r[8]),
    deleted: bool(r[9]),
  };
  if (!m.p1 || !m.p2 || Number.isNaN(m.s1) || Number.isNaN(m.s2)) return null;
  return m;
}

export function playerToRow(p: Player): (string | number | boolean)[] {
  return [p.id, p.name, p.createdAt];
}

export function matchToRow(m: Match): (string | number | boolean)[] {
  return [m.id, m.date, m.type, m.p1, m.s1, m.p2, m.s2, m.winner, m.createdAt, m.deleted];
}

/* ---------- Google Sheets store ---------- */

function sheetsStore(): Store {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!email || !key || !spreadsheetId) {
    throw new ConfigError(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY or GOOGLE_SHEET_ID",
    );
  }

  const client = new auth.JWT({
    email,
    // Vercel and .env files store the key with literal "\n" sequences.
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const api: sheets_v4.Sheets = sheetsApi({ version: "v4", auth: client });

  async function append(tab: string, row: (string | number | boolean)[]) {
    await api.spreadsheets.values.append({
      spreadsheetId,
      range: `${tab}!A:A`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
  }

  return {
    async read() {
      const res = await api.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: [`${PLAYERS_TAB}!A2:C`, `${MATCHES_TAB}!A2:J`],
        valueRenderOption: "UNFORMATTED_VALUE",
      });
      const [p, m] = res.data.valueRanges ?? [];
      return {
        players: (p?.values ?? []).map(rowToPlayer).filter((x): x is Player => !!x),
        matches: (m?.values ?? []).map(rowToMatch).filter((x): x is Match => !!x),
      };
    },
    appendPlayer: (p) => append(PLAYERS_TAB, playerToRow(p)),
    appendMatch: (m) => append(MATCHES_TAB, matchToRow(m)),
    async setDeleted(matchId, deleted) {
      const res = await api.spreadsheets.values.get({
        spreadsheetId,
        range: `${MATCHES_TAB}!A:A`,
      });
      const idx = (res.data.values ?? []).findIndex((r) => str(r[0]) === matchId);
      if (idx < 1) return false; // 0 is the header row
      await api.spreadsheets.values.update({
        spreadsheetId,
        range: `${MATCHES_TAB}!J${idx + 1}`,
        valueInputOption: "RAW",
        requestBody: { values: [[deleted]] },
      });
      return true;
    },
  };
}

/* ---------- In-memory store (PINGIS_MOCK=1) ---------- */

const globalForMock = globalThis as unknown as { __pingisMock?: Data };

function mockStore(): Store {
  if (!globalForMock.__pingisMock) {
    globalForMock.__pingisMock = {
      players: [
        { id: "p_johnny", name: "Johnny Ly", createdAt: "2026-10-15T00:00:00.000Z" },
        { id: "p_henrik", name: "Henrik Fresk", createdAt: "2026-10-15T00:00:00.000Z" },
      ],
      matches: [
        {
          id: "m_migr001",
          date: "2026-10-15",
          type: 11,
          p1: "p_johnny",
          s1: 6,
          p2: "p_henrik",
          s2: 11,
          winner: "p_henrik",
          createdAt: "2026-10-15T00:00:00.000Z",
          deleted: false,
        },
        {
          id: "m_migr002",
          date: "2026-10-15",
          type: 11,
          p1: "p_johnny",
          s1: 11,
          p2: "p_henrik",
          s2: 13,
          winner: "p_henrik",
          createdAt: "2026-10-15T00:00:01.000Z",
          deleted: false,
        },
      ],
    };
  }
  const db = globalForMock.__pingisMock;
  return {
    async read() {
      return structuredClone(db);
    },
    async appendPlayer(p) {
      db.players.push(p);
    },
    async appendMatch(m) {
      db.matches.push(m);
    },
    async setDeleted(id, deleted) {
      const m = db.matches.find((x) => x.id === id);
      if (!m) return false;
      m.deleted = deleted;
      return true;
    },
  };
}

let cached: Store | null = null;

export function getStore(): Store {
  if (!cached) cached = process.env.PINGIS_MOCK === "1" ? mockStore() : sheetsStore();
  return cached;
}
