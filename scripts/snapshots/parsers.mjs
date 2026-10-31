// Pure parsers for the Wikipedia pages behind the WRC, boxing and rugby
// snapshots. Each takes a DOM Document (jsdom in Node, or a browser
// DOMParser document) of Wikipedia's REST HTML and returns plain data.
// Columns are found by header text, not position, so cosmetic table edits
// on Wikipedia don't silently shift values.

export const clean = (s) => String(s ?? "").replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
// <br> separates lines inside cells but has no text of its own, so
// textContent would glue "Murat Gassiev<br>34–2" into "Murat Gassiev34–2".
const text = (el) => {
  if (!el) return "";
  const c = el.cloneNode(true);
  c.querySelectorAll?.("br").forEach((br) => br.replaceWith(" "));
  return clean(c.textContent);
};
// Standings tables give each car of a team its own row (rowspan); only the
// first row of a team starts with a plain position number.
const isPosCell = (cell) => /^\d{1,2}$/.test(text(cell));
const tables = (doc) => [...doc.querySelectorAll("table.wikitable")];
const headerCells = (t) => [...(t.rows[0]?.cells ?? [])].map(text);
const col = (t, ...names) => headerCells(t).findIndex((h) => names.includes(h));
const num = (s) => { const m = String(s).replace(/−/g, "-").match(/-?\d+/); return m ? Number(m[0]) : NaN; };

const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
/** "22 January" (+ year) or "October 24, 2026" -> "2026-01-22" */
export function toISO(s, year) {
  const t = clean(s).toLowerCase();
  let m = t.match(/(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/);
  if (m && MONTHS.includes(m[2])) return iso(m[3] ?? year, MONTHS.indexOf(m[2]), m[1]);
  m = t.match(/([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (m && MONTHS.includes(m[1])) return iso(m[3], MONTHS.indexOf(m[1]), m[2]);
  return null;
}
const iso = (y, mi, d) => `${y}-${String(mi + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// Flag shown next to the country name of a cell (Wikipedia flag icons).
export function flagCountry(cell) {
  const img = cell?.querySelector?.(".flagicon img, img");
  return clean(img?.getAttribute("alt") || cell?.querySelector?.(".flagicon a")?.getAttribute("title") || "");
}

/* ───────────────────────────── WRC ───────────────────────────── */

export function parseWrc(doc, year) {
  const all = tables(doc);
  const calT = all.find((t) => col(t, "Round") >= 0 && col(t, "Start date") >= 0 && col(t, "Removal reason") < 0);
  const sumT = all.find((t) => col(t, "Winning driver") >= 0);
  const drvT = all.find((t) => col(t, "Pos.") === 0 && col(t, "Driver") === 1);
  const manT = all.find((t) => col(t, "Pos.") === 0 && col(t, "Manufacturer") === 1);
  if (!calT || !sumT || !drvT || !manT) throw new Error("WRC: expected tables not found");

  const winners = {};
  for (const r of [...sumT.rows].slice(1)) {
    const c = [...r.cells].map(text);
    const round = num(c[col(sumT, "Round")]);
    const w = c[col(sumT, "Winning driver")];
    if (Number.isFinite(round) && w) winners[round] = w.split(" ").pop();
  }

  const iR = col(calT, "Round"), iS = col(calT, "Start date"), iE = col(calT, "Finish date"), iN = col(calT, "Rally"), iH = col(calT, "Rally headquarters");
  const calendar = [...calT.rows].slice(1).map((r) => {
    const c = [...r.cells].map(text);
    const round = num(c[iR]);
    if (!Number.isFinite(round)) return null;
    return {
      round, name: c[iN], country: c[iH].split(",").pop().trim(),
      start: toISO(c[iS], year), end: toISO(c[iE], year), winner: winners[round] ?? null,
    };
  }).filter((r) => r && r.start && r.end);

  // Entrants tables use rowspans: carry the last seen entrant/car down.
  const entrants = {};
  for (const t of all.filter((t) => /entries/i.test(text(t.querySelector("caption"))))) {
    let entrant = "", car = "";
    for (const r of [...t.rows].slice(1)) {
      for (const c of r.cells) {
        const v = text(c);
        if (/Rally1|Rally2/.test(v)) car = v;
        else if (/(WRT|Racing|Team)\d*$/.test(v)) entrant = v;
      }
      for (const c of r.cells) {
        const v = text(c);
        if (v && !entrants[v] && /^[\p{L}'.\- ]+ [\p{L}'.\- ]+$/u.test(v) && v !== entrant && v !== car) entrants[v] = { entrant, car };
      }
    }
  }

  const drivers = [...drvT.rows].slice(1).map((r) => {
    const c = [...r.cells];
    if (!isPosCell(c[0])) return null;
    const pos = num(text(c[0]));
    const name = text(c[1]);
    if (!name) return null;
    const e = entrants[name] ?? {};
    return { pos, name, country: flagCountry(c[1]), entrant: e.entrant ?? "", car: e.car ?? "", pts: num(text(c[c.length - 1])) };
  }).filter(Boolean);

  const manufacturers = [...manT.rows].slice(1).map((r) => {
    const c = [...r.cells];
    if (!isPosCell(c[0]) || c.length < 3) return null;
    return { pos: num(text(c[0])), name: text(c[1]), pts: num(text(c[c.length - 1])) };
  }).filter(Boolean);

  return { season: String(year), calendar, drivers, manufacturers };
}

/* ─────────────────────────── Boxing ──────────────────────────── */

const BODIES = ["WBA", "WBC", "IBF", "WBO", "Ring"];

function headingFor(t) {
  // Parsoid wraps each section in <section> led by its heading; the desktop
  // skin uses <div class="mw-heading">. Support both.
  for (let el = t.previousElementSibling; el; el = el.previousElementSibling) {
    if (/^H[2-4]$/.test(el.tagName) || el.classList?.contains("mw-heading")) return text(el);
  }
  const h = t.closest?.("section")?.querySelector(":scope > h2, :scope > h3, :scope > h4, :scope > .mw-heading");
  return text(h);
}

export function parseBelt(cell) {
  const t = text(cell);
  if (!t || /^vacant/i.test(t)) return null;
  const m = t.match(/^(.*?)\s+(?:(?:Super|Regular|Unified|Interim) [Cc]hampion\s+)?(\d+[–-]\d+(?:[–-]\d+)?)(?: \(\d+\))? \((\d+) KO\) ([A-Z][a-z]+ \d{1,2}, \d{4})/);
  if (!m) return null;
  return { name: m[1].replace(/\s+(Super|Regular|Unified|Interim) [Cc]hampion$/, ""), record: m[2].replace(/-/g, "–"), ko: Number(m[3]), since: toISO(m[4]) };
}

export function parseBoxing(doc) {
  const divisions = [];
  for (const t of tables(doc)) {
    const hdr = headerCells(t);
    if (!(hdr.includes("WBA") && hdr.includes("WBO"))) continue;
    const division = headingFor(t).replace(/edit$/i, "").split(/[(/]/)[0].trim();
    const row = t.rows[1];
    if (!division || !row) continue;
    const belts = {};
    BODIES.forEach((b, i) => { belts[b] = parseBelt(row.cells[hdr.indexOf(b === "Ring" ? "The Ring" : b)] ?? row.cells[i]); });
    divisions.push({ division, belts });
  }
  return { divisions };
}

/* ─────────────────────────── Rugby ───────────────────────────── */

export function parseLeagueTable(doc) {
  const t = tables(doc).find((t) => col(t, "Pos", "Pos.", "Position") === 0 && col(t, "Pts") >= 0 && col(t, "Team") >= 0);
  if (!t) throw new Error("league table not found");
  const i = { team: col(t, "Team"), p: col(t, "Pld", "P"), w: col(t, "W"), d: col(t, "D"), l: col(t, "L"), pd: col(t, "PD"), pts: col(t, "Pts") };
  return [...t.rows].slice(1).map((r) => {
    const c = [...r.cells].map(text);
    const pos = num(c[0]);
    if (!Number.isFinite(pos) || !c[i.team]) return null;
    return { pos, team: c[i.team], p: num(c[i.p]), w: num(c[i.w]), d: num(c[i.d]), l: num(c[i.l]), gd: c[i.pd], pts: num(c[i.pts]) };
  }).filter(Boolean);
}

/** Latest round of results from rugby match boxes (Template:Rugbybox). */
export function parseRecentResults(doc, competition, limit = 6) {
  const out = [];
  for (const ev of doc.querySelectorAll(".vevent")) {
    let p = null;
    try { p = JSON.parse(ev.getAttribute("data-mw") || "null")?.parts?.[0]?.template?.params; } catch { /* not a template box */ }
    const date = toISO(p?.date?.wt ?? text(ev));
    const score = (p?.score?.wt ?? "").match(/(\d+)\s*[–-]\s*(\d+)/);
    const fns = [...ev.querySelectorAll(".fn")].map(text);
    if (!date || !score || fns.length < 2) continue;
    const team = (s) => s.replace(/\(\d+ BP\)/g, "").trim();
    out.push({ home: team(fns[0]), homeScore: Number(score[1]), awayScore: Number(score[2]), away: team(fns[1]), competition, date });
  }
  out.sort((a, b) => b.date.localeCompare(a.date));
  return out.slice(0, limit);
}

/* ─────────────────────────── Seasons ─────────────────────────── */

/** Six Nations runs Feb–Mar: before February, the latest one is last year's. */
export const sixNationsYear = (d = new Date()) => (d.getUTCMonth() === 0 ? d.getUTCFullYear() - 1 : d.getUTCFullYear());
/** Club seasons start in August: "2026–27". */
export function clubSeason(d = new Date()) {
  const y = d.getUTCMonth() >= 7 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return `${y}–${String((y + 1) % 100).padStart(2, "0")}`;
}
