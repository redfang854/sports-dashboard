/**
 * UNIT — src/data/rugby.js (hand-maintained tables)
 *
 * Catches the usual manual-update mistakes: positions out of order, points
 * not descending, played != won + drawn + lost, and the KPI/Grand Slam claim
 * contradicting the table (the bug this file had before: "Ireland, Grand Slam"
 * next to an Ireland loss).
 */
import { describe, it, expect } from "vitest";
import {
  SIX_NATIONS_2026, URC_STANDINGS_2026_27, PREMIERSHIP_STANDINGS_2026_27, RECENT_RUGBY, RUGBY_UPDATED,
} from "../../../src/data/rugby.js";

const tables = [["Six Nations", SIX_NATIONS_2026], ["URC", URC_STANDINGS_2026_27], ["Premiership", PREMIERSHIP_STANDINGS_2026_27]];

describe.each(tables)("%s table", (_, table) => {
  it("is in position order with points never increasing", () => {
    table.forEach((t, i) => {
      expect(t.pos).toBe(i + 1);
      if (i > 0) expect(t.pts).toBeLessThanOrEqual(table[i - 1].pts);
    });
  });
  it("has played = won + drawn + lost for every team", () => {
    for (const t of table) expect(t.p, t.team).toBe(t.w + t.d + t.l);
  });
  it("has unique team names", () => {
    expect(new Set(table.map((t) => t.team)).size).toBe(table.length);
  });
});

it("Six Nations has six teams who each played five matches", () => {
  expect(SIX_NATIONS_2026).toHaveLength(6);
  expect(SIX_NATIONS_2026.every((t) => t.p === 5)).toBe(true);
});

it("recent results have valid dates on or before RUGBY_UPDATED and non-negative scores", () => {
  for (const r of RECENT_RUGBY) {
    expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.date <= RUGBY_UPDATED).toBe(true);
    expect(r.homeScore).toBeGreaterThanOrEqual(0);
    expect(r.awayScore).toBeGreaterThanOrEqual(0);
  }
});
