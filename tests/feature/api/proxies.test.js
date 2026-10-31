/**
 * FEATURE — key-bearing proxy routes: /api/teams, /api/apisports,
 * /api/citoapi, /api/standings (real handlers, fetch + rate limiter mocked)
 *
 * Goes right: an allowed endpoint is forwarded once, with the key, to the
 * right upstream host.
 * Goes wrong (asserted): a non-allow-listed endpoint or bad params must be
 * rejected with 400 BEFORE any upstream call (so the key is never used), and
 * no route may send Access-Control-Allow-Origin: * (other sites must not be
 * able to use our keys from a browser).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReq, mockRes } from "../../helpers/http.js";

vi.mock("../../../api/_rateLimit.js", () => ({ checkRateLimit: vi.fn(async () => true) }));

import teams from "../../../api/teams.js";
import apisports from "../../../api/apisports.js";
import citoapi from "../../../api/citoapi.js";
import standings from "../../../api/standings.js";

const ok = (body = {}) => ({ ok: true, status: 200, headers: new Headers(), json: async () => body });
let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn(async () => ok({ response: [], errors: [] }));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("FOOTBALL_API_KEY", "fd-test-key");
  vi.stubEnv("API_SPORTS_KEY", "as-test-key");
  vi.stubEnv("CITO_API_KEY", "cito-test-key");
});

async function call(handler, query) {
  const res = mockRes();
  await handler(mockReq({ query }), res);
  return res;
}

const routes = [
  ["teams (football-data)", teams, { endpoint: "teams/57" }, "https://api.football-data.org/v4/teams/57", "X-Auth-Token", "fd-test-key"],
  ["apisports (API-Football)", apisports, { endpoint: "players/squads", team: "33" }, "https://v3.football.api-sports.io/players/squads?team=33", "x-apisports-key", "as-test-key"],
  ["citoapi (UFC)", citoapi, { endpoint: "ufc/events/recent" }, "https://api.citoapi.com/api/v1/ufc/events/recent", null, null],
];

describe.each(routes)("%s", (_, handler, goodQuery, expectedUrl, header, key) => {
  it("forwards an allowed endpoint once, to the right host", async () => {
    const res = await call(handler, goodQuery);
    expect(res.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(expectedUrl);
    if (header) expect(fetchMock.mock.calls[0][1].headers[header]).toBe(key);
  });

  it.each(["status", "../status", "matches?x=1", "https://evil.test"])("rejects '%s' without calling upstream", async (endpoint) => {
    const res = await call(handler, { endpoint });
    expect(res.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects array-valued params without calling upstream", async () => {
    const res = await call(handler, { ...goodQuery, extra: ["a", "b"] });
    expect(res.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not allow cross-origin browser use", async () => {
    const res = await call(handler, goodQuery);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("standings", () => {
  it("forwards an allowed competition", async () => {
    fetchMock.mockResolvedValue(ok({ standings: [] }));
    const res = await call(standings, { comp: "PL" });
    expect(res.statusCode).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.football-data.org/v4/competitions/PL/standings");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it.each([undefined, "WC", "PL/../../persons", ["PL", "PD"], "pl"])("rejects comp=%s without calling upstream", async (comp) => {
    const res = await call(standings, { comp });
    expect(res.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
