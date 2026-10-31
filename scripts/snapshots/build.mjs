// Turns parser output into the snapshot JSON the site reads: adds colours,
// flags and short names, and validates before anything is written.

const FLAGS = {
  "United Kingdom": "🇬🇧", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", Ireland: "🇮🇪", "Republic of Ireland": "🇮🇪",
  France: "🇫🇷", Italy: "🇮🇹", Spain: "🇪🇸", Portugal: "🇵🇹", Germany: "🇩🇪", Belgium: "🇧🇪", Luxembourg: "🇱🇺",
  Sweden: "🇸🇪", Finland: "🇫🇮", Estonia: "🇪🇪", Latvia: "🇱🇻", Poland: "🇵🇱", Croatia: "🇭🇷", Greece: "🇬🇷",
  Monaco: "🇲🇨", Kenya: "🇰🇪", Japan: "🇯🇵", Mexico: "🇲🇽", Chile: "🇨🇱", Paraguay: "🇵🇾", Argentina: "🇦🇷",
  "Saudi Arabia": "🇸🇦", "New Zealand": "🇳🇿", Australia: "🇦🇺", "South Africa": "🇿🇦", Norway: "🇳🇴",
  "Czech Republic": "🇨🇿", Austria: "🇦🇹", Turkey: "🇹🇷", "United States": "🇺🇸", Canada: "🇨🇦", Bolivia: "🇧🇴",
};
// Wikipedia flags British drivers as "United Kingdom"; show home nations
// for the drivers we know.
const HOME_NATION = { "Elfyn Evans": "Wales", "Kris Meeke": "United Kingdom" };
const flagged = (country) => (FLAGS[country] ? `${FLAGS[country]} ${country === "Republic of Ireland" ? "Ireland" : country}` : country);

const MAKE = [
  { match: /toyota/i,  team: "Toyota",  short: "Toyota",  color: "#CC0000" },
  { match: /hyundai/i, team: "Hyundai", short: "Hyundai", color: "#002C5F" },
  { match: /ford|m-sport/i, team: "M-Sport", short: "M-Sport", color: "#003580" },
];
const make = (s) => MAKE.find((m) => m.match.test(s)) ?? { team: "", short: s.split(" ")[0], color: "#8A93A3" };

export function buildWrc(parsed, { updated, maxDrivers = 10 }) {
  return {
    updated,
    source: "FIA WRC results via Wikipedia (CC BY-SA 4.0)",
    season: parsed.season,
    drivers: parsed.drivers.slice(0, maxDrivers).map((d) => {
      const m = make(`${d.entrant} ${d.car}`);
      return {
        pos: d.pos, name: d.name, nationality: flagged(HOME_NATION[d.name] ?? d.country),
        team: m.team || d.entrant, car: d.car.replace(/^(Toyota|Hyundai|Ford)\s+/i, ""), pts: d.pts, color: m.color,
      };
    }),
    manufacturers: parsed.manufacturers.map((x) => ({ pos: x.pos, name: x.name, short: make(x.name).short, pts: x.pts, color: make(x.name).color })),
    calendar: parsed.calendar.map((r) => ({ ...r, country: flagged(r.country) })),
  };
}

export function buildBoxing(parsed, { updated }) {
  return { updated, source: "WBA/WBC/IBF/WBO/The Ring via Wikipedia (CC BY-SA 4.0)", divisions: parsed.divisions };
}

const URC_COUNTRY = {
  "Glasgow Warriors": "Scotland", Edinburgh: "Scotland", Leinster: "Ireland", Munster: "Ireland", Connacht: "Ireland", Ulster: "Ireland",
  Bulls: "South Africa", Stormers: "South Africa", Sharks: "South Africa", Lions: "South Africa",
  Ospreys: "Wales", Cardiff: "Wales", Dragons: "Wales", Scarlets: "Wales", Benetton: "Italy", Zebre: "Italy",
};
const TEAM_COLOR = {
  France: "#002395", Ireland: "#169B62", Scotland: "#003580", Italy: "#009246", England: "#E8E8E8", Wales: "#D01010",
  "Glasgow Warriors": "#02A9CE", Edinburgh: "#B22234", Leinster: "#003082", Bulls: "#0057B8", Stormers: "#0072C6", Sharks: "#000000",
  Ospreys: "#6E6E6E", Connacht: "#0B7A3E", Munster: "#CC0000", Cardiff: "#00A3E0", Lions: "#C8102E", Ulster: "#E4002B",
  Dragons: "#C8102E", Scarlets: "#B4001E", Benetton: "#0B6E3E", Zebre: "#000000",
  Gloucester: "#C8102E", "Leicester Tigers": "#0B6E3E", "Bristol Bears": "#002F5F", "Northampton Saints": "#00573F",
  Saracens: "#E8E8E8", Bath: "#004B87", "Sale Sharks": "#003580", "Newcastle Red Bulls": "#DB0A40", "Exeter Chiefs": "#000000", Harlequins: "#00A650",
};
const withLook = (country) => (t) => ({ ...t, flag: FLAGS[country(t.team)] ?? "", color: TEAM_COLOR[t.team] ?? "#8A93A3" });

export function buildRugby({ six, urc, prem, recent }, { updated, sixYear, clubSeason }) {
  const sixFinal = six.length > 0 && six.every((t) => t.p === 5);
  return {
    updated,
    source: "Six Nations, URC and Premiership tables via Wikipedia (CC BY-SA 4.0)",
    sixNations:  { season: `${sixYear} · ${sixFinal ? "final table" : "in progress"}`, table: six.map(withLook((t) => t)) },
    urc:         { season: `${clubSeason} · in progress`, table: urc.map(withLook((t) => URC_COUNTRY[t] ?? "")) },
    premiership: { season: `${clubSeason} · in progress`, table: prem.map(withLook(() => "England")) },
    recent,
  };
}

/* ─────────────── validation: refuse to write suspicious data ─────────────── */

const ordered = (rows) => rows.every((r, i) => r.pos === i + 1 && (i === 0 || r.pts <= rows[i - 1].pts));

export function validateWrc(s) {
  const e = [];
  if (s.calendar.length < 8) e.push(`only ${s.calendar.length} calendar rounds`);
  if (s.drivers.length < 5) e.push(`only ${s.drivers.length} drivers`);
  if (s.manufacturers.length < 2) e.push(`only ${s.manufacturers.length} manufacturers`);
  if (!ordered(s.drivers)) e.push("drivers not in position/points order");
  if (!ordered(s.manufacturers)) e.push("manufacturers not in position/points order");
  if (s.calendar.some((r) => !r.start || !r.end || r.end < r.start)) e.push("calendar has invalid dates");
  return e;
}

export function validateBoxing(s) {
  const e = [];
  if (s.divisions.length < 15) e.push(`only ${s.divisions.length} divisions`);
  const filled = s.divisions.reduce((n, d) => n + Object.values(d.belts).filter(Boolean).length, 0);
  if (filled < 40) e.push(`only ${filled} belts parsed (expected 60+)`);
  return e;
}

export function validateRugby(s) {
  const e = [];
  for (const [k, min] of [["sixNations", 6], ["urc", 12], ["premiership", 8]]) {
    const t = s[k].table;
    if (t.length < min) e.push(`${k}: only ${t.length} teams`);
    if (!ordered(t)) e.push(`${k}: not in position/points order`);
    if (t.some((r) => r.p !== r.w + r.d + r.l)) e.push(`${k}: P != W + D + L`);
  }
  return e;
}
