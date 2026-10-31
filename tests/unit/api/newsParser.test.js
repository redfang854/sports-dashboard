/**
 * UNIT — api/_newsParser.js (pure RSS parsing, no network, no database)
 *
 * What this covers:
 *   decode()    CDATA unwrapping, entity decoding, HTML stripping (tags become
 *               spaces so paragraphs don't merge), Autosport "Keep reading" removal.
 *   tag()       extracting one element's text from an <item> block.
 *   image()     media:thumbnail > media:content > enclosure precedence, and the
 *               BBC 240px -> 480px thumbnail upgrade.
 *   safeUrl()   only http(s) URLs pass; javascript:/data:/relative are rejected.
 *   parseFeed() full pipeline: newest-first sort, MAX_ITEMS cap, items without a
 *               title or safe link dropped, duplicate links dropped, bad dates kept
 *               but sorted last.
 *
 * Goes right: a normal BBC/Autosport feed produces <= 6 clean, newest-first items.
 * Goes wrong (each guarded below): HTML/entities leaking into text, glued
 * paragraphs, script URLs reaching an href, duplicate React keys, unbounded lists,
 * an unparseable date crashing the sort, empty/garbage input throwing.
 */
import { describe, it, expect } from "vitest";
import { decode, tag, image, safeUrl, parseFeed, MAX_ITEMS } from "../../../api/_newsParser.js";
import { rss } from "../../helpers/http.js";

describe("decode", () => {
  it("unwraps CDATA and trims whitespace", () => {
    expect(decode("<![CDATA[  Hello world  ]]>")).toBe("Hello world");
  });

  it("decodes common HTML entities", () => {
    expect(decode("Tom &amp; Jerry &quot;quoted&quot; it&#39;s &lt;b&gt; &#8217;")).toBe(
      "Tom & Jerry \"quoted\" it's ’"
    );
  });

  it("strips HTML (including entity-encoded HTML) and keeps paragraphs apart", () => {
    expect(decode("<p>First para.</p><p>Second para.</p>")).toBe("First para. Second para.");
    expect(decode("&lt;p&gt;Encoded one.&lt;/p&gt;&lt;p&gt;Encoded two.&lt;/p&gt;")).toBe("Encoded one. Encoded two.");
  });

  it("removes Autosport's trailing 'Keep reading'", () => {
    expect(decode("Some summary ...Keep reading")).toBe("Some summary ...");
    expect(decode("Keep reading is fine mid-sentence, though")).toBe("Keep reading is fine mid-sentence, though");
  });

  it("returns an empty string for missing input", () => {
    expect(decode()).toBe("");
    expect(decode("")).toBe("");
  });
});

describe("tag", () => {
  it("extracts and decodes an element's content", () => {
    expect(tag("<item><title><![CDATA[ A &amp; B ]]></title></item>", "title")).toBe("A & B");
  });

  it("returns an empty string when the element is missing", () => {
    expect(tag("<item></item>", "pubDate")).toBe("");
  });
});

describe("image", () => {
  it("prefers media:thumbnail over enclosure", () => {
    const block = '<media:thumbnail url="https://a.test/t.jpg"/><enclosure url="https://a.test/e.jpg"/>';
    expect(image(block)).toBe("https://a.test/t.jpg");
  });

  it("falls back to enclosure (Autosport format)", () => {
    expect(image('<enclosure url="https://cdn.test/e.jpg" type="image/jpeg"/>')).toBe("https://cdn.test/e.jpg");
  });

  it("upgrades both BBC 240px thumbnail formats to 480px", () => {
    expect(image('<media:thumbnail url="https://ichef.bbci.co.uk/images/ic/240x135/p0abc.jpg"/>'))
      .toBe("https://ichef.bbci.co.uk/images/ic/480x270/p0abc.jpg");
    expect(image('<media:thumbnail url="https://ichef.bbci.co.uk/ace/standard/240/cpsprodpb/x.png"/>'))
      .toBe("https://ichef.bbci.co.uk/ace/standard/480/cpsprodpb/x.png");
  });

  it("decodes &amp; in image URLs", () => {
    expect(image('<enclosure url="https://cdn.test/i.jpg?a=1&amp;b=2"/>')).toBe("https://cdn.test/i.jpg?a=1&b=2");
  });

  it("returns null when there is no image", () => {
    expect(image("<item><title>x</title></item>")).toBeNull();
  });
});

describe("safeUrl", () => {
  it.each(["https://bbc.co.uk/a", "http://example.com", "HTTPS://UPPER.TEST"])("allows %s", (url) => {
    expect(safeUrl(url)).toBe(url);
  });

  it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<script>", "/relative", "", null, undefined, 42])(
    "rejects %s",
    (url) => { expect(safeUrl(url)).toBeNull(); }
  );
});

describe("parseFeed", () => {
  const item = (n, date, extra = {}) => ({
    title: `Story ${n}`,
    description: `Summary ${n}`,
    link: `https://news.test/${n}`,
    pubDate: date,
    ...extra,
  });

  it("returns items newest first with every field populated", () => {
    const xml = rss([
      item(1, "Fri, 30 Oct 2026 10:00:00 GMT", { thumbnail: "https://img.test/1.jpg" }),
      item(2, "Sat, 31 Oct 2026 10:00:00 GMT"),
    ]);
    const out = parseFeed(xml, "BBC Sport");
    expect(out.map((i) => i.title)).toEqual(["Story 2", "Story 1"]);
    expect(out[1]).toEqual({
      title: "Story 1",
      summary: "Summary 1",
      url: "https://news.test/1",
      image: "https://img.test/1.jpg",
      publishedAt: "2026-10-30T10:00:00.000Z",
      source: "BBC Sport",
    });
    expect(out[0].image).toBeNull();
  });

  it(`caps output at MAX_ITEMS (${MAX_ITEMS})`, () => {
    const xml = rss(Array.from({ length: 20 }, (_, n) => item(n, `Sat, 31 Oct 2026 ${String(n).padStart(2, "0")}:00:00 GMT`)));
    const out = parseFeed(xml, "BBC Sport");
    expect(out).toHaveLength(MAX_ITEMS);
    expect(out[0].title).toBe("Story 19");
  });

  it("drops items with no title, no link, or an unsafe link", () => {
    const xml = rss([
      item(1, "Sat, 31 Oct 2026 10:00:00 GMT", { title: "" }),
      item(2, "Sat, 31 Oct 2026 10:00:00 GMT", { link: undefined }),
      item(3, "Sat, 31 Oct 2026 10:00:00 GMT", { link: "javascript:alert(document.cookie)" }),
      item(4, "Sat, 31 Oct 2026 10:00:00 GMT"),
    ]);
    expect(parseFeed(xml, "X").map((i) => i.title)).toEqual(["Story 4"]);
  });

  it("drops an unsafe image but keeps the story", () => {
    const xml = rss([item(1, "Sat, 31 Oct 2026 10:00:00 GMT", { enclosure: "javascript:alert(1)" })]);
    const [only] = parseFeed(xml, "X");
    expect(only.title).toBe("Story 1");
    expect(only.image).toBeNull();
  });

  it("removes duplicate links, keeping the first occurrence", () => {
    const xml = rss([
      item(1, "Sat, 31 Oct 2026 10:00:00 GMT"),
      item(1, "Sat, 31 Oct 2026 11:00:00 GMT", { title: "Story 1 (updated)" }),
    ]);
    const out = parseFeed(xml, "X");
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe("Story 1");
  });

  it("keeps items with an unparseable date but sorts them last", () => {
    const xml = rss([item(1, "not a date"), item(2, "Sat, 31 Oct 2026 10:00:00 GMT")]);
    const out = parseFeed(xml, "X");
    expect(out.map((i) => i.title)).toEqual(["Story 2", "Story 1"]);
    expect(out[1].publishedAt).toBeNull();
  });

  it.each([["empty string", ""], ["null", null], ["HTML error page", "<html><body>502 Bad Gateway</body></html>"]])(
    "returns [] for %s instead of throwing",
    (_, input) => { expect(parseFeed(input, "X")).toEqual([]); }
  );

  it("parses a realistic Autosport item (HTML summary + enclosure)", () => {
    const xml = `<rss><channel><item>
      <title>Rally US host city announced</title>
      <link>https://www.autosport.com/wrc/news/x/1/?utm_source=RSS</link>
      <description>&lt;p&gt;Knoxville will host the event next year.&lt;/p&gt;&lt;p&gt;Earlier this month the calendar was released ...&lt;/p&gt;Keep reading</description>
      <pubDate>Tue, 27 Oct 2026 15:50:57 +0000</pubDate>
      <enclosure url="https://cdn-2.motorsport.com/images/amp/x/s6/a.jpg" type="image/jpeg"/>
    </item></channel></rss>`;
    const [only] = parseFeed(xml, "Autosport");
    expect(only.summary).toBe("Knoxville will host the event next year. Earlier this month the calendar was released ...");
    expect(only.image).toBe("https://cdn-2.motorsport.com/images/amp/x/s6/a.jpg");
    expect(only.publishedAt).toBe("2026-10-27T15:50:57.000Z");
  });
});
