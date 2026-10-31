#!/usr/bin/env node
// Refreshes the hand-maintained sports data (WRC, boxing, rugby) from
// Wikipedia and rewrites src/data/snapshots/*.json.
//
//   npm run update:snapshots              # all three
//   npm run update:snapshots -- --only=wrc,rugby
//   npm run update:snapshots -- --dry-run # print what would change, write nothing
//
// Each sport is validated before writing; if Wikipedia's page layout has
// changed and the result looks wrong, that file is left untouched and the
// script exits non-zero. Run `npm test` afterwards, then commit and push.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseWrc, parseBoxing, parseLeagueTable, parseRecentResults, sixNationsYear, clubSeason } from "./snapshots/parsers.mjs";
import { buildWrc, buildBoxing, buildRugby, validateWrc, validateBoxing, validateRugby } from "./snapshots/build.mjs";

// jsdom (and the test tooling) need Node 22.22+; fail with a clear message
// instead of a stack trace from deep inside a dependency.
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 22)) {
  console.error(`✗ Node ${process.versions.node} is too old: this project needs Node 22.22 or newer.`);
  console.error("  With nvm:  nvm install 22 && nvm use 22   (the repo's .nvmrc pins 22)");
  process.exit(1);
}
const { JSDOM } = await import("jsdom");

const OUT = (name) => fileURLToPath(new URL(`../src/data/snapshots/${name}.json`, import.meta.url));
// Wikimedia asks API clients to identify themselves.
const UA = "ApexSportsDashboard/1.0 (https://github.com/redfang854/sports-dashboard)";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = (args.find((a) => a.startsWith("--only=")) ?? "--only=wrc,boxing,rugby").slice(7).split(",");
const today = new Date();
const updated = today.toISOString().slice(0, 10);

async function page(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw Object.assign(new Error(`${title}: HTTP ${res.status}`), { status: res.status });
  return new JSDOM(await res.text()).window.document;
}

async function firstPage(titles) {
  for (const t of titles) {
    try { return { title: t, doc: await page(t) }; } catch (e) { if (e.status !== 404) throw e; }
  }
  throw new Error(`none of these pages exist: ${titles.join(", ")}`);
}

const JOBS = {
  async wrc() {
    const y = today.getUTCFullYear();
    // Early January the new season's page may not have results yet.
    const { title, doc } = await firstPage([`${y} World Rally Championship`, `${y - 1} World Rally Championship`]);
    return { title, data: buildWrc(parseWrc(doc, Number(title.slice(0, 4))), { updated }), validate: validateWrc };
  },
  async boxing() {
    const title = "List of current world boxing champions";
    return { title, data: buildBoxing(parseBoxing(await page(title)), { updated }), validate: validateBoxing };
  },
  async rugby() {
    const sixYear = sixNationsYear(today), season = clubSeason(today);
    const [six, urc, prem] = await Promise.all([
      page(`${sixYear} Six Nations Championship`),
      page(`${season} United Rugby Championship`),
      page(`${season} Premiership Rugby`),
    ]);
    const data = buildRugby({
      six: parseLeagueTable(six), urc: parseLeagueTable(urc), prem: parseLeagueTable(prem),
      recent: parseRecentResults(prem, "Premiership", 5),
    }, { updated, sixYear, clubSeason: season });
    return { title: `${sixYear} Six Nations, ${season} URC + Premiership`, data, validate: validateRugby };
  },
};

function summarise(name, before, after) {
  const pick = {
    wrc: (s) => `${s.season}: leader ${s.drivers[0]?.name} ${s.drivers[0]?.pts} pts, ${s.calendar.filter((r) => r.winner).length}/${s.calendar.length} rounds won`,
    boxing: (s) => `${s.divisions.length} divisions, ${s.divisions.reduce((n, d) => n + Object.values(d.belts).filter(Boolean).length, 0)} belts`,
    rugby: (s) => `Six Nations ${s.sixNations.table[0]?.team}; URC ${s.urc.table[0]?.team} ${s.urc.table[0]?.pts}; Prem ${s.premiership.table[0]?.team} ${s.premiership.table[0]?.pts}`,
  }[name];
  return `  before: ${before ? pick(before) : "(none)"}\n  after:  ${pick(after)}`;
}

let failed = 0;
for (const name of only) {
  if (!JOBS[name]) { console.error(`unknown snapshot "${name}" (use wrc, boxing, rugby)`); failed++; continue; }
  try {
    const { title, data, validate } = await JOBS[name]();
    const errors = validate(data);
    let before = null;
    try { before = JSON.parse(await readFile(OUT(name), "utf8")); } catch { /* first run */ }
    if (errors.length) {
      failed++;
      console.error(`✗ ${name} (${title}) NOT written:\n  - ${errors.join("\n  - ")}`);
      continue;
    }
    console.log(`✓ ${name} (${title})\n${summarise(name, before, data)}`);
    if (!dryRun) await writeFile(OUT(name), JSON.stringify(data, null, 2) + "\n");
  } catch (e) {
    failed++;
    console.error(`✗ ${name} failed: ${e.message}`);
  }
}
if (dryRun) console.log("\nDry run: nothing written.");
else if (failed) console.log("\nSome snapshots failed (see above); those files were left unchanged.");
else console.log("\nNext: npm test, then commit and push.");
process.exit(failed ? 1 : 0);
