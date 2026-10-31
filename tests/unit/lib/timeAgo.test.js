/**
 * UNIT — src/lib/timeAgo.js (relative timestamps shown on news items)
 *
 * Covers each bucket boundary (just now / minutes / hours / days / date),
 * missing and invalid input, and slightly-future timestamps from a feed whose
 * clock is ahead (must not show "-3m ago"). `now` is injected so results never
 * depend on when the suite runs.
 */
import { describe, it, expect } from "vitest";
import { timeAgo } from "../../../src/lib/timeAgo.js";

const NOW = Date.parse("2026-10-31T12:00:00Z");
const ago = (ms) => new Date(NOW - ms).toISOString();
const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

describe("timeAgo", () => {
  it.each([
    [ago(10_000), "just now"],
    [ago(1 * MIN), "1m ago"],
    [ago(59 * MIN), "59m ago"],
    [ago(60 * MIN), "1h ago"],
    [ago(23 * HOUR), "23h ago"],
    [ago(24 * HOUR), "1d ago"],
    [ago(6 * DAY), "6d ago"],
  ])("%s -> %s", (iso, expected) => {
    expect(timeAgo(iso, NOW)).toBe(expected);
  });

  it("falls back to a short date after a week", () => {
    const out = timeAgo(ago(10 * DAY), NOW);
    expect(out).not.toMatch(/ago$/);
    expect(out).toMatch(/21|Oct/); // locale-dependent format, but must name the day or month
  });

  it("treats future timestamps as 'just now'", () => {
    expect(timeAgo(new Date(NOW + 3 * MIN).toISOString(), NOW)).toBe("just now");
  });

  it.each([null, undefined, "", "garbage"])("returns '' for %s", (input) => {
    expect(timeAgo(input, NOW)).toBe("");
  });
});
