/**
 * FEATURE — GET /api/news?sport=... (api/news.js handler, end to end)
 *
 * Runs the real handler with a fake req/res. The upstream RSS fetch and the
 * Upstash rate limiter are mocked, so the suite is fast, offline and never hits
 * BBC/Autosport or Redis. No database is involved.
 *
 * Goes right: each of the six sports maps to the right feed URL, returns 200 with
 * parsed items and CDN cache headers.
 * Goes wrong (each asserted): unknown sport, prototype keys (?sport=constructor),
 * array params (?sport=a&sport=b), non-GET methods, rate limit exceeded, upstream
 * 4xx/5xx, network failure/timeout, oversized feed. Failures must return 502 with
 * Cache-Control: no-store (so the CDN never caches an outage) and must not leak
 * internal error details to the client.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReq, mockRes, rss } from "../../helpers/http.js";

const { checkRateLimit } = vi.hoisted(() => ({ checkRateLimit: vi.fn() }));
vi.mock("../../../api/_rateLimit.js", () => ({ checkRateLimit }));

import handler, { FEEDS, MAX_FEED_BYTES } from "../../../api/news.js";

const okFeed = rss([
  { title: "Older", link: "https://news.test/older", pubDate: "Fri, 30 Oct 2026 10:00:00 GMT" },
  { title: "Newer", link: "https://news.test/newer", pubDate: "Sat, 31 Oct 2026 10:00:00 GMT" },
]);

function stubFetch(impl) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
const textResponse = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => body });

async function call(query, method = "GET") {
  const res = mockRes();
  await handler(mockReq({ method, query }), res);
  return res;
}

beforeEach(() => {
  checkRateLimit.mockReset().mockResolvedValue(true);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/news — success", () => {
  it.each(Object.entries(FEEDS))("%s fetches its configured feed", async (sport, feed) => {
    const fetchMock = stubFetch(async () => textResponse(okFeed));
    const res = await call({ sport });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(feed.url);
    expect(res.statusCode).toBe(200);
    expect(res.body.sport).toBe(sport);
    expect(res.body.items.map((i) => i.title)).toEqual(["Newer", "Older"]);
    expect(res.body.items[0].source).toBe(feed.source);
  });

  it("sets CDN cache headers on success", async () => {
    stubFetch(async () => textResponse(okFeed));
    const res = await call({ sport: "f1" });
    expect(res.headers["cache-control"]).toBe("public, s-maxage=900, stale-while-revalidate=3600");
  });

  it("sends an identifying User-Agent and a timeout signal upstream", async () => {
    const fetchMock = stubFetch(async () => textResponse(okFeed));
    await call({ sport: "rugby" });
    const opts = fetchMock.mock.calls[0][1];
    expect(opts.headers["User-Agent"]).toMatch(/ApexSportsDashboard/);
    expect(opts.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns 200 with an empty list when the feed has no usable items", async () => {
    stubFetch(async () => textResponse(rss([])));
    const res = await call({ sport: "boxing" });
    expect(res.statusCode).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it("only uses the hard-coded feed URLs (no user-controlled fetch target)", () => {
    for (const { url } of Object.values(FEEDS)) {
      expect(url).toMatch(/^https:\/\/(feeds\.bbci\.co\.uk|www\.autosport\.com)\//);
    }
    expect(Object.isFrozen(FEEDS)).toBe(true);
  });
});

describe("GET /api/news — rejected requests", () => {
  it.each([
    ["missing sport", {}],
    ["unknown sport", { sport: "cricket" }],
    ["prototype key 'constructor'", { sport: "constructor" }],
    ["prototype key '__proto__'", { sport: "__proto__" }],
    ["prototype key 'toString'", { sport: "toString" }],
    ["repeated param (array)", { sport: ["football", "f1"] }],
  ])("400 for %s, without fetching", async (_, query) => {
    const fetchMock = stubFetch(async () => textResponse(okFeed));
    const res = await call(query);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/sport must be one of/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["POST", "PUT", "DELETE"])("405 for %s", async (method) => {
    const fetchMock = stubFetch(async () => textResponse(okFeed));
    const res = await call({ sport: "football" }, method);
    expect(res.statusCode).toBe(405);
    expect(res.headers.allow).toBe("GET");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("stops when the rate limiter rejects (limiter writes the 429 itself)", async () => {
    checkRateLimit.mockResolvedValue(false);
    const fetchMock = stubFetch(async () => textResponse(okFeed));
    const res = await call({ sport: "football" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.body).toBeUndefined();
  });

  it("rate-limits under the 'news' bucket at 30 requests/minute", async () => {
    stubFetch(async () => textResponse(okFeed));
    await call({ sport: "football" });
    expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), expect.anything(), "news", { requests: 30, window: "60 s" });
  });
});

describe("GET /api/news — upstream failures", () => {
  const failures = [
    ["upstream 500", async () => textResponse("oops", 500)],
    ["upstream 404", async () => textResponse("missing", 404)],
    ["network error", async () => { throw new TypeError("fetch failed"); }],
    ["timeout", async () => { throw new DOMException("The operation was aborted due to timeout", "TimeoutError"); }],
    ["oversized feed", async () => textResponse("x".repeat(MAX_FEED_BYTES + 1))],
  ];

  it.each(failures)("%s -> 502, not cached, no internal detail leaked", async (_, impl) => {
    stubFetch(impl);
    const res = await call({ sport: "wrc" });
    expect(res.statusCode).toBe(502);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.body).toEqual({ error: "News feed unavailable", items: [] });
    expect(console.error).toHaveBeenCalled(); // detail goes to server logs only
  });
});
