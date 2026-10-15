import { describe, expect, it } from "vitest";
import { validateScore } from "@/lib/rules";

describe("validateScore", () => {
  it.each([
    [11, 11, 6, 1],
    [11, 6, 11, 2],
    [11, 13, 11, 1],
    [11, 12, 10, 1],
    [11, 11, 0, 1],
    [11, 11, 9, 1],
    [21, 21, 19, 1],
    [21, 24, 22, 1],
    [21, 19, 21, 2],
  ] as const)("type %i: %i-%i is valid", (type, a, b, winner) => {
    expect(validateScore(type, a, b)).toEqual({ ok: true, winner });
  });

  it.each([
    [11, 11, 10, "win_by_two"],
    [11, 14, 11, "deuce_margin"],
    [11, 9, 7, "target_not_reached"],
    [11, 10, 8, "target_not_reached"],
    [11, 15, 10, "deuce_margin"],
    [11, 5, 5, "tie"],
    [21, 21, 20, "win_by_two"],
    [21, 20, 18, "target_not_reached"],
    [21, 25, 22, "deuce_margin"],
    [21, 11, 6, "target_not_reached"],
  ] as const)("type %i: %i-%i is %s", (type, a, b, error) => {
    const r = validateScore(type, a, b);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(error);
  });

  it("rejects incomplete and invalid numbers", () => {
    expect(validateScore(11, null, 5)).toMatchObject({ ok: false, error: "incomplete" });
    expect(validateScore(11, -1, 11)).toMatchObject({ ok: false, error: "invalid_number" });
    expect(validateScore(11, 11.5, 9)).toMatchObject({ ok: false, error: "invalid_number" });
    expect(validateScore(11, 100, 98)).toMatchObject({ ok: false, error: "invalid_number" });
  });
});
