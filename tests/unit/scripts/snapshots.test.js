// @vitest-environment jsdom
/**
 * UNIT — scripts/snapshots/{parsers,build}.mjs (npm run update:snapshots)
 *
 * The fixtures reproduce the structures seen on the live Wikipedia REST HTML
 * (31 Oct 2026): <br>-separated cells, one row per car with only the first
 * starting with a position, a "Removal reason" table for cancelled rallies,
 * flag icons, Parsoid <section> headings and Rugbybox data-mw params. The
 * parsers were also run against the live pages before these were written.
 *
 * Goes right: each page becomes the JSON the site reads.
 * Goes wrong (asserted): glued text, continuation rows read as teams,
 * cancelled rounds in the calendar, column order changes, bonus-point
 * markers in team names, and validation must REFUSE suspicious output.
 */
import { describe, it, expect } from "vitest";
import {
  toISO, parseBelt, parseBoxing, parseWrc, parseLeagueTable, parseRecentResults, sixNationsYear, clubSeason,
} from "../../../scripts/snapshots/parsers.mjs";
import { buildWrc, buildRugby, validateWrc, validateBoxing, validateRugby } from "../../../scripts/snapshots/build.mjs";

const doc = (html) => new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
const flag = (country) => `<span class="flagicon"><img alt="${country}"></span>`;

describe("toISO", () => {
  it.each([["22 January", 2026, "2026-01-22"], ["30 July", 2026, "2026-07-30"], ["July 1, 2026", undefined, "2026-07-01"], ["25 October 2026", undefined, "2026-10-25"], ["TBA", 2026, null]])(
    "%s -> %s", (s, y, out) => { expect(toISO(s, y)).toBe(out); }
  );
});

describe("boxing", () => {
  const cell = (name, rec, ko, date) => `<td><a>${name}</a><br>${rec} (${ko} KO)<br>${date}</td>`;
  const page = `
    <section><h3>Heavyweight (+200 lb)</h3><table class="wikitable">
      <tr><th>WBA</th><th>WBC</th><th>IBF</th><th>WBO</th><th>The Ring</th></tr>
      <tr>${cell("Murat Gassiev", "34–2 (1)", 27, "July 1, 2026")}${cell("Agit Kabayel", "27–0", 19, "June 27, 2026")}<td>vacant</td>${cell("Daniel Dubois", "24-3", 23, "May 9, 2026")}${cell("Oleksandr Usyk", "25–0", 16, "August 20, 2022")}</tr>
    </table></section>
    <section><h3>Cruiserweight/Junior heavyweight</h3><table class="wikitable">
      <tr><th>WBA</th><th>WBC</th><th>IBF</th><th>WBO</th><th>The Ring</th></tr>
      <tr><td><a>David Benavidez</a><br>Super champion<br>32–0 (26 KO)<br>May 2, 2026</td><td>vacant</td><td>vacant</td><td>vacant</td><td>vacant</td></tr>
    </table></section>
    <table class="wikitable"><tr><th>Rank</th><th>Name</th></tr></table>`;

  it("splits <br>-separated name, record, KOs and date (no glued text)", () => {
    const d = doc(`<table><tr>${cell("Murat Gassiev", "34–2 (1)", 27, "July 1, 2026")}</tr></table>`);
    expect(parseBelt(d.querySelector("td"))).toEqual({ name: "Murat Gassiev", record: "34–2", ko: 27, since: "2026-07-01" });
  });

  it("parses every division table, headings from Parsoid sections, vacant belts as null", () => {
    const { divisions } = parseBoxing(doc(page));
    expect(divisions.map((d) => d.division)).toEqual(["Heavyweight", "Cruiserweight"]);
    expect(divisions[0].belts.IBF).toBeNull();
    expect(divisions[0].belts.WBO).toEqual({ name: "Daniel Dubois", record: "24–3", ko: 23, since: "2026-05-09" });
    expect(divisions[0].belts.Ring.name).toBe("Oleksandr Usyk");
  });

  it("strips 'Super champion' labels from names", () => {
    expect(parseBoxing(doc(page)).divisions[1].belts.WBA.name).toBe("David Benavidez");
  });

  it("validation refuses a page that parsed almost nothing", () => {
    expect(validateBoxing(parseBoxing(doc(page)))).toEqual(expect.arrayContaining([expect.stringMatching(/divisions/), expect.stringMatching(/belts/)]));
  });
});

describe("WRC", () => {
  const page = `
    <table class="wikitable"><tr><th>Round</th><th>Start date</th><th>Finish date</th><th>Rally</th><th>Rally headquarters</th></tr>
      <tr><td>1</td><td>22 January</td><td>25 January</td><td>Rallye Monte Carlo</td><td>Gap, Provence, France</td></tr>
      <tr><td>2</td><td>12 February</td><td>15 February</td><td>Rally Sweden</td><td>Umeå, Västerbotten County, Sweden</td></tr></table>
    <table class="wikitable"><tr><th>Start date</th><th>Finish date</th><th>Rally</th><th>Removal reason</th></tr>
      <tr><td>11 November</td><td>14 November</td><td>Rally Saudi Arabia</td><td>Cancelled</td></tr></table>
    <table class="wikitable"><caption>Rally1 entries eligible to score manufacturer points</caption>
      <tr><th>Manufacturer</th><th>Entrant</th><th>Car</th><th>Driver name</th></tr>
      <tr><td rowspan="2">Toyota</td><td rowspan="2">Toyota Gazoo Racing WRT</td><td rowspan="2">Toyota GR Yaris Rally1</td><td>Elfyn Evans</td></tr>
      <tr><td>Oliver Solberg</td></tr></table>
    <table class="wikitable"><tr><th>Round</th><th>Event</th><th>Winning driver</th></tr>
      <tr><td>1</td><td>Monte Carlo</td><td>Oliver Solberg</td></tr><tr><td>2</td><td>Sweden</td><td>Elfyn Evans</td></tr></table>
    <table class="wikitable"><tr><th>Pos.</th><th>Driver</th><th>Points</th></tr>
      <tr><td>1</td><td>${flag("United Kingdom")} Elfyn Evans</td><td>243</td></tr>
      <tr><td>2</td><td>${flag("Sweden")} Oliver Solberg</td><td>238</td></tr></table>
    <table class="wikitable"><tr><th>Pos.</th><th>Manufacturer</th><th>MON</th><th>Points</th></tr>
      <tr><td rowspan="2">1</td><td rowspan="2">Toyota Gazoo Racing WRT</td><td>1<br>25+4+3</td><td rowspan="2">662</td></tr>
      <tr><td>2<br>17+5+5</td></tr>
      <tr><td>2</td><td>Hyundai Shell Mobis WRT</td><td>4</td><td>440</td></tr></table>`;

  const parsed = parseWrc(doc(page), 2026);

  it("builds the calendar with ISO dates and winners, ignoring cancelled rounds", () => {
    expect(parsed.calendar).toEqual([
      { round: 1, name: "Rallye Monte Carlo", country: "France", start: "2026-01-22", end: "2026-01-25", winner: "Solberg" },
      { round: 2, name: "Rally Sweden", country: "Sweden", start: "2026-02-12", end: "2026-02-15", winner: "Evans" },
    ]);
  });

  it("reads drivers with flag country and team/car from the rowspanned entrants table", () => {
    expect(parsed.drivers[1]).toEqual({ pos: 2, name: "Oliver Solberg", country: "Sweden", entrant: "Toyota Gazoo Racing WRT", car: "Toyota GR Yaris Rally1", pts: 238 });
  });

  it("does not read a team's second-car rows as extra manufacturers", () => {
    expect(parsed.manufacturers).toEqual([
      { pos: 1, name: "Toyota Gazoo Racing WRT", pts: 662 },
      { pos: 2, name: "Hyundai Shell Mobis WRT", pts: 440 },
    ]);
  });

  it("build adds team colours, short names and flags (Wales for Evans)", () => {
    const built = buildWrc(parsed, { updated: "2026-10-31" });
    expect(built.drivers[0]).toMatchObject({ nationality: "🏴󠁧󠁢󠁷󠁬󠁳󠁿 Wales", team: "Toyota", car: "GR Yaris Rally1", color: "#CC0000" });
    expect(built.manufacturers[1]).toMatchObject({ short: "Hyundai", color: "#002C5F" });
    expect(built.calendar[1].country).toBe("🇸🇪 Sweden");
    expect(built.source).toMatch(/CC BY-SA 4\.0/);
  });

  it("validation refuses a short calendar and unordered standings", () => {
    const built = buildWrc(parsed, { updated: "2026-10-31" });
    built.drivers = [built.drivers[1], built.drivers[0]];
    const errors = validateWrc(built);
    expect(errors).toEqual(expect.arrayContaining([expect.stringMatching(/calendar/), expect.stringMatching(/drivers not in position/)]));
  });

  it("throws if the expected tables are missing (layout change)", () => {
    expect(() => parseWrc(doc("<table class='wikitable'><tr><th>x</th></tr></table>"), 2026)).toThrow(/expected tables/);
  });
});

describe("rugby", () => {
  const table = (rows, header = "<th>Pos</th><th>Team</th><th>Pld</th><th>W</th><th>D</th><th>L</th><th>PF</th><th>PD</th><th>Pts</th>") =>
    `<table class="wikitable"><tr>${header}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>`;

  it("finds columns by header name, keeping the Unicode minus in points difference", () => {
    const rows = parseLeagueTable(doc(table([[1, "France", 5, 4, 0, 1, 211, "+81", 21], [2, "Scotland", 5, 3, 0, 2, 143, "−1", 16]])));
    expect(rows).toEqual([
      { pos: 1, team: "France", p: 5, w: 4, d: 0, l: 1, gd: "+81", pts: 21 },
      { pos: 2, team: "Scotland", p: 5, w: 3, d: 0, l: 2, gd: "−1", pts: 16 },
    ]);
  });

  it("still works if Wikipedia reorders columns", () => {
    const rows = parseLeagueTable(doc(table([[1, 9, "Gloucester", 4, 3, 1, 0, "+80"]], "<th>Pos</th><th>Pts</th><th>Team</th><th>Pld</th><th>W</th><th>L</th><th>D</th><th>PD</th>")));
    expect(rows[0]).toEqual({ pos: 1, team: "Gloucester", p: 4, w: 3, d: 0, l: 1, gd: "+80", pts: 9 });
  });

  it("reads match boxes from data-mw, strips bonus-point markers, newest first", () => {
    const box = (date, home, score, away) =>
      `<div class="vevent" data-mw='${JSON.stringify({ parts: [{ template: { params: { date: { wt: date }, score: { wt: score } } } }] })}'>` +
      `<span class="fn">${home}</span><span class="fn">${away}</span></div>`;
    const results = parseRecentResults(doc(box("23 October 2026", "Gloucester", "23–5", "Bath") + box("25 October 2026", "(1 BP) Harlequins", "33–15", "Saracens")), "Premiership");
    expect(results).toEqual([
      { home: "Harlequins", homeScore: 33, awayScore: 15, away: "Saracens", competition: "Premiership", date: "2026-10-25" },
      { home: "Gloucester", homeScore: 23, awayScore: 5, away: "Bath", competition: "Premiership", date: "2026-10-23" },
    ]);
  });

  it("labels the Six Nations final only when every team has played 5", () => {
    const six = [1, 2, 3, 4, 5, 6].map((pos) => ({ pos, team: "France", p: 5, w: 1, d: 0, l: 4, gd: "0", pts: 30 - pos }));
    const built = buildRugby({ six, urc: [], prem: [], recent: [] }, { updated: "2026-10-31", sixYear: 2026, clubSeason: "2026–27" });
    expect(built.sixNations.season).toBe("2026 · final table");
    expect(built.sixNations.table[0]).toMatchObject({ flag: "🇫🇷", color: "#002395" });
    const validation = validateRugby(built);
    expect(validation).toEqual(expect.arrayContaining([expect.stringMatching(/urc: only 0/), expect.stringMatching(/premiership: only 0/)]));
  });
});

describe("season helpers", () => {
  it.each([["2026-01-15", 2025], ["2026-02-01", 2026], ["2026-10-31", 2026]])("Six Nations year on %s is %i", (d, y) => {
    expect(sixNationsYear(new Date(`${d}T12:00:00Z`))).toBe(y);
  });
  it.each([["2026-07-31", "2025–26"], ["2026-08-01", "2026–27"], ["2027-03-10", "2026–27"], ["2099-09-01", "2099–00"]])("club season on %s is %s", (d, s) => {
    expect(clubSeason(new Date(`${d}T12:00:00Z`))).toBe(s);
  });
});
