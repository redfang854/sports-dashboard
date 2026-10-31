import { checkRateLimit } from "./_rateLimit.js";
import { parseFeed } from "./_newsParser.js";

// Latest headlines per sport, from public RSS feeds (no API keys). BBC
// Sport covers five of the six sports; BBC has no WRC feed, so WRC uses
// Autosport's. CDN cache headers below mean each feed is re-read at most
// about every 15 minutes.
export const FEEDS = Object.freeze({
  football: { url: "https://feeds.bbci.co.uk/sport/football/rss.xml",           source: "BBC Sport" },
  f1:       { url: "https://feeds.bbci.co.uk/sport/formula1/rss.xml",           source: "BBC Sport" },
  mma:      { url: "https://feeds.bbci.co.uk/sport/mixed-martial-arts/rss.xml", source: "BBC Sport" },
  boxing:   { url: "https://feeds.bbci.co.uk/sport/boxing/rss.xml",             source: "BBC Sport" },
  rugby:    { url: "https://feeds.bbci.co.uk/sport/rugby-union/rss.xml",        source: "BBC Sport" },
  wrc:      { url: "https://www.autosport.com/rss/wrc/news/",                   source: "Autosport" },
});

// A real feed is well under 1 MB; refuse anything absurdly large so a
// misbehaving upstream can't make the function buffer unbounded data.
export const MAX_FEED_BYTES = 2 * 1024 * 1024;
const UA = "Mozilla/5.0 (compatible; ApexSportsDashboard/1.0; +https://sports-dashboard-redfang.vercel.app)";

export default async function handler(req, res) {
  if (req.method && req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const allowed = await checkRateLimit(req, res, "news", { requests: 30, window: "60 s" });
  if (!allowed) return;

  // Own-property check: a plain FEEDS[sport] lookup would accept
  // ?sport=constructor or ?sport=toString via the object prototype.
  const sport = req.query?.sport;
  const feed = typeof sport === "string" && Object.hasOwn(FEEDS, sport) ? FEEDS[sport] : null;
  if (!feed) {
    return res.status(400).json({ error: `sport must be one of: ${Object.keys(FEEDS).join(", ")}` });
  }

  try {
    const upstream = await fetch(feed.url, {
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" },
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) throw new Error(`Feed responded ${upstream.status}`);
    const xml = await upstream.text();
    if (xml.length > MAX_FEED_BYTES) throw new Error(`Feed too large (${xml.length} bytes)`);
    const items = parseFeed(xml, feed.source);

    // Vercel CDN: serve cached for 15 min, then serve stale for up to an
    // hour while refreshing in the background.
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    return res.status(200).json({ sport, items });
  } catch (err) {
    // Log the detail server-side only; the client gets a generic message.
    console.error(`news(${sport}) failed:`, err.message);
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "News feed unavailable", items: [] });
  }
}
