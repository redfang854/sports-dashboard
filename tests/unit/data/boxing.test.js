/**
 * UNIT — src/data/boxing.js (champions snapshot + derived summaries)
 *
 * The page's KPIs, "Unified Champions" and "Latest Title Changes" are all
 * derived from BOXING_DIVISIONS, so these helpers decide what visitors see.
 *
 * Goes right: one entry per fighter per division with all their belts;
 * undisputed only when one fighter holds all four major belts; title
 * changes grouped per fight.
 * Goes wrong (asserted): a malformed record string, a belt dated after the
 * snapshot, The Ring counting toward "undisputed", the same fight listed once
 * per belt, unsorted output.
 */
import { describe, it, expect } from "vitest";
import {
  BOXING_DIVISIONS, BOXING_UPDATED, BODIES, MAJOR_BODIES,
  parseRecord, isUndisputed, championsFrom, latestTitleChanges,
} from "../../../src/data/boxing.js";

const belt = (name, since = "2026-01-01", record = "10–0", ko = 5) => ({ name, record, ko, since });
const div = (division, belts) => ({ division, belts: { WBA: null, WBC: null, IBF: null, WBO: null, Ring: null, ...belts } });

describe("parseRecord", () => {
  it.each([["25–1", { w: 25, l: 1, d: 0 }], ["29–0–1", { w: 29, l: 0, d: 1 }], ["20-0", { w: 20, l: 0, d: 0 }], ["", { w: 0, l: 0, d: 0 }]])(
    "%s", (input, expected) => { expect(parseRecord(input)).toEqual(expected); }
  );
});

describe("isUndisputed", () => {
  it("is true only when one fighter holds all four major belts", () => {
    const four = { WBA: belt("A"), WBC: belt("A"), IBF: belt("A"), WBO: belt("A") };
    expect(isUndisputed(div("X", four))).toBe(true);
    expect(isUndisputed(div("X", { ...four, WBC: belt("B") }))).toBe(false);
    expect(isUndisputed(div("X", { ...four, WBC: null }))).toBe(false);
  });
  it("ignores The Ring belt", () => {
    expect(isUndisputed(div("X", { WBA: belt("A"), WBC: belt("A"), IBF: belt("A"), Ring: belt("A") }))).toBe(false);
  });
});

describe("championsFrom", () => {
  const data = [
    div("Heavy", { WBA: belt("A", "2026-01-01", "20–0", 15), WBO: belt("A", "2026-02-01", "20–0", 15), Ring: belt("B") }),
    div("Light", { WBC: belt("A", "2025-01-01", "20–0", 15) }),
  ];
  it("groups belts per fighter per division", () => {
    const out = championsFrom(data);
    const heavyA = out.find((c) => c.name === "A" && c.division === "Heavy");
    expect(heavyA.belts.map((b) => b.body)).toEqual(["WBA", "WBO"]);
    expect(out.filter((c) => c.name === "A")).toHaveLength(2); // separate divisions stay separate
  });
  it("computes KO rate from KOs and wins", () => {
    expect(championsFrom(data)[0].koRate).toBe(75);
  });
  it("sorts by number of major belts first", () => {
    expect(championsFrom(data)[0]).toMatchObject({ name: "A", division: "Heavy" });
  });
});

describe("latestTitleChanges", () => {
  it("merges belts won by one fighter on the same day and sorts newest first", () => {
    const data = [
      div("Heavy", { IBF: belt("A", "2026-10-24"), WBO: belt("A", "2026-10-24"), Ring: belt("A", "2026-10-24") }),
      div("Light", { WBA: belt("B", "2026-10-10") }),
    ];
    expect(latestTitleChanges(data)).toEqual([
      { name: "A", division: "Heavy", since: "2026-10-24", bodies: ["IBF", "WBO", "Ring"] },
      { name: "B", division: "Light", since: "2026-10-10", bodies: ["WBA"] },
    ]);
  });
  it("respects the limit", () => {
    expect(latestTitleChanges(BOXING_DIVISIONS, 3)).toHaveLength(3);
  });
});

describe("boxing data integrity", () => {
  it("every division lists every body (null when vacant)", () => {
    for (const d of BOXING_DIVISIONS) expect(Object.keys(d.belts).sort()).toEqual([...BODIES].sort());
  });
  it("every belt has a valid record, KO count and a date on or before BOXING_UPDATED", () => {
    const bad = [];
    for (const d of BOXING_DIVISIONS) for (const b of BODIES) {
      const x = d.belts[b];
      if (!x) continue;
      const rec = parseRecord(x.record);
      if (!/^\d+–\d+(–\d+)?$/.test(x.record) || x.ko > rec.w || !/^\d{4}-\d{2}-\d{2}$/.test(x.since) || x.since > BOXING_UPDATED) {
        bad.push(`${d.division} ${b}: ${x.name}`);
      }
    }
    expect(bad).toEqual([]);
  });
  it("a fighter holding several belts in one division has one consistent record", () => {
    for (const d of BOXING_DIVISIONS) {
      const byName = {};
      for (const b of MAJOR_BODIES.concat("Ring")) {
        const x = d.belts[b];
        if (x) (byName[x.name] ||= new Set()).add(`${x.record}/${x.ko}`);
      }
      for (const [name, recs] of Object.entries(byName)) expect(recs.size, `${name} in ${d.division}`).toBe(1);
    }
  });
});
