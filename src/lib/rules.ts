import type { GameType } from "./types";

export const GAME_TYPES: GameType[] = [11, 21];
export const MAX_SCORE = 99;

export type ScoreError =
  | "incomplete"
  | "invalid_number"
  | "tie"
  | "target_not_reached"
  | "win_by_two"
  | "deuce_margin";

export type ScoreResult =
  | { ok: true; winner: 1 | 2 }
  | { ok: false; error: ScoreError; leader: 0 | 1 | 2 };

/**
 * Validates a finished table tennis game.
 * The winner must reach the target and lead by 2. If the winner went past the
 * target (deuce), the margin must be exactly 2.
 */
export function validateScore(
  type: GameType,
  a: number | null | undefined,
  b: number | null | undefined,
): ScoreResult {
  if (a == null || b == null || Number.isNaN(a) || Number.isNaN(b)) {
    return { ok: false, error: "incomplete", leader: 0 };
  }
  if (
    !Number.isInteger(a) ||
    !Number.isInteger(b) ||
    a < 0 ||
    b < 0 ||
    a > MAX_SCORE ||
    b > MAX_SCORE
  ) {
    return { ok: false, error: "invalid_number", leader: 0 };
  }
  if (a === b) return { ok: false, error: "tie", leader: 0 };

  const leader: 1 | 2 = a > b ? 1 : 2;
  const w = Math.max(a, b);
  const l = Math.min(a, b);

  if (w < type) return { ok: false, error: "target_not_reached", leader };
  if (w - l < 2) return { ok: false, error: "win_by_two", leader };
  if (w > type && w - l !== 2) return { ok: false, error: "deuce_margin", leader };

  return { ok: true, winner: leader };
}

export function isGameType(v: unknown): v is GameType {
  return v === 11 || v === 21;
}
