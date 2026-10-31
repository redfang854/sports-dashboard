/**
 * UNIT — api/_endpointGuard.js (allow-lists for key-bearing proxy routes)
 *
 * Every proxy attaches a secret API key upstream. Before this guard, any
 * caller could forward ANY path with our key (quota theft / probing). This
 * pins which endpoint shapes pass and that tricks to escape them fail.
 */
import { describe, it, expect } from "vitest";
import {
  isAllowedEndpoint, safeParams,
  FOOTBALL_DATA_ENDPOINTS, API_FOOTBALL_ENDPOINTS, CITO_ENDPOINTS, STANDINGS_COMPETITIONS,
} from "../../../api/_endpointGuard.js";

describe("isAllowedEndpoint — endpoints the site uses pass", () => {
  it.each([
    [FOOTBALL_DATA_ENDPOINTS, "competitions/2021/matches"],
    [FOOTBALL_DATA_ENDPOINTS, "competitions/2014/teams"],
    [FOOTBALL_DATA_ENDPOINTS, "teams/57"],
    [FOOTBALL_DATA_ENDPOINTS, "teams/57/matches"],
    [FOOTBALL_DATA_ENDPOINTS, "matches"],
    [API_FOOTBALL_ENDPOINTS, "fixtures"],
    [API_FOOTBALL_ENDPOINTS, "fixtures/headtohead"],
    [API_FOOTBALL_ENDPOINTS, "players/squads"],
    [API_FOOTBALL_ENDPOINTS, "teams"],
    [CITO_ENDPOINTS, "ufc/events/recent"],
    [CITO_ENDPOINTS, "ufc/events/upcoming"],
    [CITO_ENDPOINTS, "ufc/events/ufc-fight-night-moicano-vs-nolan/bouts"],
  ])("%#: %s", (list, ep) => { expect(isAllowedEndpoint(ep, list)).toBe(true); });
});

describe("isAllowedEndpoint — everything else is rejected", () => {
  it.each([
    "status",                                   // account info
    "competitions/2021/scorers",                // real endpoint, not used by the site
    "teams/57/../../status",                    // traversal
    "teams/57%2F..%2Fstatus",                   // encoded traversal
    "matches?limit=999",                        // smuggled query
    "matches#x",
    "/matches",                                 // leading slash
    "teams//57",
    "teams/57/matches/extra",
    "https://evil.test/x",
    "a".repeat(200),
    "",
  ])("rejects %s", (ep) => {
    for (const list of [FOOTBALL_DATA_ENDPOINTS, API_FOOTBALL_ENDPOINTS, CITO_ENDPOINTS]) {
      expect(isAllowedEndpoint(ep, list)).toBe(false);
    }
  });

  it.each([undefined, null, 42, ["matches"], { a: 1 }])("rejects non-string %s", (ep) => {
    expect(isAllowedEndpoint(ep, FOOTBALL_DATA_ENDPOINTS)).toBe(false);
  });
});

describe("safeParams", () => {
  it("passes plain scalar params through", () => {
    expect(safeParams({ season: "2026", team: "33" }).toString()).toBe("season=2026&team=33");
  });
  it.each([
    ["array value (repeated param)", { team: ["1", "2"] }],
    ["odd key", { "a b": "1" }],
    ["very long value", { q: "x".repeat(101) }],
    ["too many params", Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`k${i}`, "1"]))],
  ])("rejects %s", (_, input) => { expect(safeParams(input)).toBeNull(); });
  it("treats no params as empty", () => {
    expect(safeParams(undefined).toString()).toBe("");
  });
});

it("standings only allows the competitions the site shows", () => {
  expect(STANDINGS_COMPETITIONS).toEqual(["PL", "PD", "SA", "BL1", "FL1", "CL"]);
});
