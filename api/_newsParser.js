// Pure RSS parsing helpers for api/news.js. Kept in an underscore-prefixed
// file so Vercel does not expose it as a route, and so it can be unit
// tested without network access.

export const MAX_ITEMS = 6;

export function decode(str = "") {
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

export function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
}

export function image(block) {
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
// javascript: or data: URL into an href/src on the page.
export function safeUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url) ? url : null;
}

export function parseFeed(xml, source) {
  const items = String(xml || "").match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  const seen = new Set();
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
    .filter((i) => {
      // Drop items without a usable title/link, and duplicate links (feeds
      // sometimes repeat a story; duplicates would also clash as React keys).
      if (!i.title || !i.url || seen.has(i.url)) return false;
      seen.add(i.url);
      return true;
    })
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .slice(0, MAX_ITEMS);
}
