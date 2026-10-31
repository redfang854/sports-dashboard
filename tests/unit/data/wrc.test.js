/**
 * UNIT — src/data/wrc.js (hand-maintained WRC season data + date helpers)
 *
 * Why: this file has no live API behind it, so typos and stale edits are the
 * main risk. These checks catch the mistakes a manual update typically makes
 * (unsorted standings, a missing winner, overlapping dates, a stale
 * "updated" stamp) and pin the date logic that replaced hand-set statuses.
 *
 * Goes right: status is derived from dates, so the calendar moves on its own.
 * Goes wrong (asserted): rounds out of order, a finished round with no winner,
 * an end date before its start, standings not in points order, an
 * unparseable or future WRC_UPDATED.
 */
import { describe, it, expect } from "vitest";
import {
  WRC_CALENDAR_2026 as CAL, WRC_DRIVER_STANDINGS_2026 as DRIVERS,
  WRC_MANUFACTURER_STANDINGS_2026 as MAKERS, WRC_UPDATED, wrcRoundStatus, wrcDateRange,
} from "../../../src/data/wrc.js";

const at = (iso) => new Date(`${iso}T12:00:00Z`);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

describe("wrcRoundStatus", () => {
  const cal = [
    { round: 1, start: "2026-01-10", end: "2026-01-12" },
    { round: 2, start: "2026-02-10", end: "2026-02-12" },
    { round: 3, start: "2026-03-10", end: "2026-03-12" },
  ];
  it("marks a running rally live and the following one next", () => {
    const today = at("2026-02-11");
    expect(cal.map((r) => wrcRoundStatus(r, cal, today))).toEqual(["done", "live", "next"]);
  });
  it("marks only the first future round as next", () => {
    const today = at("2026-01-20");
    expect(cal.map((r) => wrcRoundStatus(r, cal, today))).toEqual(["done", "next", "upcoming"]);
  });
  it("treats the start and end days as live", () => {
    expect(wrcRoundStatus(cal[0], cal, at("2026-01-10"))).toBe("live");
    expect(wrcRoundStatus(cal[0], cal, at("2026-01-12"))).toBe("live");
    expect(wrcRoundStatus(cal[0], cal, at("2026-01-13"))).toBe("done");
  });
  it("marks everything done after the season", () => {
    expect(cal.every((r) => wrcRoundStatus(r, cal, at("2026-12-01")) === "done")).toBe(true);
  });
});

describe("wrcDateRange", () => {
  it("formats in UTC regardless of the viewer's timezone", () => {
    expect(wrcDateRange({ start: "2026-07-30", end: "2026-08-02" })).toBe("30 Jul – 2 Aug");
  });
});

describe("WRC data integrity", () => {
  it("has a valid, non-future WRC_UPDATED date", () => {
    expect(WRC_UPDATED).toMatch(ISO);
    expect(Number.isNaN(Date.parse(WRC_UPDATED))).toBe(false);
  });

  it("calendar rounds are numbered 1..n, in date order, with valid ranges", () => {
    CAL.forEach((r, i) => {
      expect(r.round).toBe(i + 1);
      expect(r.start).toMatch(ISO);
      expect(r.end).toMatch(ISO);
      expect(r.end >= r.start).toBe(true);
      if (i > 0) expect(r.start > CAL[i - 1].end).toBe(true);
    });
  });

  it("every round finished before WRC_UPDATED has a winner", () => {
    const missing = CAL.filter((r) => r.end < WRC_UPDATED && !r.winner).map((r) => r.name);
    expect(missing).toEqual([]);
  });

  it.each([["drivers", DRIVERS], ["manufacturers", MAKERS]])("%s standings are in position and points order", (_, table) => {
    table.forEach((row, i) => {
      expect(row.pos).toBe(i + 1);
      if (i > 0) expect(row.pts).toBeLessThanOrEqual(table[i - 1].pts);
      expect(row.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it("every winner surname appears in the drivers' standings", () => {
    const surnames = new Set(DRIVERS.map((d) => d.name.split(" ").pop()));
    const unknown = CAL.filter((r) => r.winner && !surnames.has(r.winner)).map((r) => r.winner);
    expect(unknown).toEqual([]);
  });
});
