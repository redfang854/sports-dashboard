// Minimal stand-ins for Vercel's Node request/response objects, enough for
// handler tests: records status, headers and the JSON body.
export function mockReq({ method = "GET", query = {}, headers = {} } = {}) {
  return { method, query, headers };
}

export function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) { res.headers[name.toLowerCase()] = value; return res; },
    status(code) { res.statusCode = code; return res; },
    json(body) { res.body = body; return res; },
  };
  return res;
}

// Builds an RSS document from item objects so tests control every field.
export function rss(items) {
  const body = items.map((i) => `
    <item>
      ${i.title !== undefined ? `<title><![CDATA[ ${i.title} ]]></title>` : ""}
      ${i.description !== undefined ? `<description><![CDATA[ ${i.description} ]]></description>` : ""}
      ${i.link !== undefined ? `<link>${i.link}</link>` : ""}
      ${i.pubDate !== undefined ? `<pubDate>${i.pubDate}</pubDate>` : ""}
      ${i.thumbnail ? `<media:thumbnail width="240" height="135" url="${i.thumbnail}"/>` : ""}
      ${i.enclosure ? `<enclosure url="${i.enclosure}" type="image/jpeg" length="0"/>` : ""}
    </item>`).join("");
  return `<?xml version="1.0"?><rss xmlns:media="http://search.yahoo.com/mrss/" version="2.0"><channel><title>Feed</title>${body}</channel></rss>`;
}
