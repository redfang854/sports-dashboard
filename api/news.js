import { checkRateLimit } from "./_rateLimit.js";

// Latest headlines per sport, from public RSS feeds. BBC Sport covers five
// of the six sports; BBC has no WRC feed, so WRC uses Autosport's.
// Feeds are re-read at most every 15 minutes thanks to the CDN cache
// headers below, so the upstream sites see very little traffic.
const FEEDS = {
  football: { url: "https://feeds.bbci.co.uk/sport/football/rss.xml",           source: "BBC Sport" },
  f1:       { url: "https://feeds.bbci.co.uk/sport/formula1/rss.xml",           source: "BBC Sport" },
  mma:      { url: "https://feeds.bbci.co.uk/sport/mixed-martial-arts/rss.xml", source: "BBC Sport" },
  boxing:   { url: "https://feeds.bbci.co.uk/sport/boxing/rss.xml",             source: "BBC Sport" },
  rugby:    { url: "https://feeds.bbci.co.uk/sport/rugby-union/rss.xml",        source: "BBC Sport" },
  wrc:      { url: "https://www.autosport.com/rss/wrc/news/",                   source: "Autosport" },
};

const MAX_ITEMS = 6;
const UA = "Mozilla/5.0 (compatible; ApexSportsDashboard/1.0; +https://sports-dashboard-redfang.vercel.app)";

function decode(str = "") {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ")             // tags become spaces so paragraphs don't run together
    .replace(/\s*Keep reading\s*$/i, "")  // Autosport appends this to every summary
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
}

function image(block) {
  const m =
    block.match(/<media:thumbnail[^>]*url="([^"]+)"/i) ||
    block.match(/<media:content[^>]*url="([^"]+)"/i) ||
    block.match(/<enclosure[^>]*url="([^"]+)"/i);
  if (!m) return null;
  // BBC serves 240px thumbnails; its image CDN returns the same picture at
  // 480px when the size segment in the path is changed.
  return m[1]
    .replace(/&amp;/g, "&")
    .replace("ichef.bbci.co.uk/images/ic/240x135/", "ichef.bbci.co.uk/images/ic/480x270/")
    .replace("ichef.bbci.co.uk/ace/standard/240/", "ichef.bbci.co.uk/ace/standard/480/");
}

// Only allow http(s) links through, so a bad feed can never inject a
// javascript: URL into an href on the page.
function safeUrl(url) {
  return /^https?:\/\//i.test(url) ? url : null;
}

function parseFeed(xml, source) {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  return items
    .map((block) => {
      const published = Date.parse(tag(block, "pubDate"));
      return {
        title: tag(block, "title"),
        summary: tag(block, "description"),
        url: safeUrl(tag(block, "link")),
        image: safeUrl(image(block) || ""),
        publishedAt: Number.isNaN(published) ? null : new Date(published).toISOString(),
        source,
      };
    })
    .filter((i) => i.title && i.url)
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .slice(0, MAX_ITEMS);
}

export default async function handler(req, res) {
  const allowed = await checkRateLimit(req, res, "news", { requests: 30, window: "60 s" });
  if (!allowed) return;

  const feed = FEEDS[req.query.sport];
  if (!feed) {
    return res.status(400).json({ error: `sport must be one of: ${Object.keys(FEEDS).join(", ")}` });
  }

  try {
    const upstream = await fetch(feed.url, {
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" },
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) throw new Error(`Feed responded ${upstream.status}`);
    const items = parseFeed(await upstream.text(), feed.source);

    // Vercel CDN: serve cached for 15 min, then serve stale for up to an
    // hour while refreshing in the background.
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    return res.status(200).json({ sport: req.query.sport, items });
  } catch (err) {
    console.error(`news(${req.query.sport}) failed:`, err.message);
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "News feed unavailable", items: [] });
  }
}
