// Matching football-data.org clubs to API-Football (API-Sports) team ids.
// The two APIs name clubs differently ("Hull City AFC" vs "Hull City",
// "FC Internazionale Milano" vs "Inter"), and API-Football's exact `name`
// filter misses most of them. We search instead, then score candidates.
// Pure functions here so they can be unit tested without the network.

export const LEAGUE_COUNTRY = { PL: "England", PD: "Spain", SA: "Italy", BL1: "Germany", FL1: "France" };

// Club-form words that carry no identity ("FC Barcelona" == "Barcelona").
const NOISE = new Set([
  "fc", "afc", "cf", "sc", "ssc", "ac", "acf", "as", "ss", "us", "cd", "rcd", "ud", "sd", "ca", "rc",
  "club", "de", "del", "la", "le", "calcio", "futbol", "football", "sv", "vfb", "vfl", "tsg", "bv", "fsv",
  "1", "04", "05", "1846", "1899", "1900", "1901", "1907", "1909", "1913",
]);

// Youth, women's and reserve sides share the club's name; never pick them.
const NON_SENIOR = /(\bw\b|\bwomen\b|\bfem|\bu\d{2}\b|\bii\b|\bb\b|\bres\.?$|\breserves?\b|\byouth\b|\bacademy\b)/i;

export function normalize(name) {
  return String(name || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")   // strip accents
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(name) {
  return normalize(name).split(" ").filter((t) => t && !NOISE.has(t));
}

// Clubs whose API-Football name can't be derived from football-data's
// (cleaned full name -> API-Football search term).
export const ALIASES = {
  "wolverhampton wanderers": "wolves",
};

// Search strings to try, best first. API-Football's `search` needs 3+
// alphanumeric characters (no punctuation).
export function searchQueries(fullName, shortName) {
  const full = tokens(fullName).join(" ");
  const short = tokens(shortName).join(" ");
  const first = tokens(fullName)[0] || "";
  return [...new Set([ALIASES[full], full, short, first])].filter((q) => q && q.length >= 3);
}

// 0..1 similarity. Strong only when every word of the candidate appears in
// our name ("Brighton" for "Brighton & Hove Albion"). A candidate with
// extra words ("Wolverhampton Casuals" for "Wolverhampton") is a different
// club far more often than not, so it only gets the plain overlap ratio.
export function score(queryName, candidateName) {
  const a = new Set(tokens(queryName));
  const b = new Set(tokens(candidateName));
  if (!a.size || !b.size) return 0;
  const shared = [...a].filter((t) => b.has(t)).length;
  if (shared === b.size) return 0.75 + 0.25 * (shared / a.size);
  return shared / new Set([...a, ...b]).size;
}

export const MIN_SCORE = 0.6;
const aliasScore = (fullName, candidate) =>
  ALIASES[tokens(fullName).join(" ")] === normalize(candidate) ? 1 : 0;

// Pick the best senior team in the right country, or null.
export function pickTeam(results, { fullName, shortName, country }) {
  let best = null;
  for (const r of results || []) {
    const t = r?.team;
    if (!t?.id || !t.name) continue;
    if (country && t.country && t.country !== country) continue;
    if (NON_SENIOR.test(t.name)) continue;
    const s = Math.max(score(fullName, t.name), score(shortName, t.name), aliasScore(fullName, t.name));
    if (s >= MIN_SCORE && (!best || s > best.s || (s === best.s && t.name.length < best.name.length))) {
      best = { id: t.id, name: t.name, s };
    }
  }
  return best ? best.id : null;
}
