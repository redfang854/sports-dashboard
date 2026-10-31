// Men's world boxing champions by division — manually maintained.
// No free live API covers the four sanctioning bodies, so this is a
// snapshot. Bump BOXING_UPDATED whenever it changes; the page shows it and
// flags it once it is more than 60 days old.
// Source: WBA/WBC/IBF/WBO and The Ring champions as listed on Wikipedia
// ("List of current world boxing champions", revision of 31 Oct 2026).
// Each belt: { name, record "W–L(–D)", ko (KO wins), since (ISO date won) }.

export const BOXING_UPDATED = "2026-10-31";
export const BOXING_SOURCE = "WBA/WBC/IBF/WBO/The Ring via Wikipedia";
export const BODIES = ["WBA", "WBC", "IBF", "WBO", "Ring"];
export const MAJOR_BODIES = ["WBA", "WBC", "IBF", "WBO"];

export const BOXING_DIVISIONS = [
  { division: "Heavyweight", belts: {
    WBA: { name: "Murat Gassiev", record: "34–2", ko: 27, since: "2026-07-01" },
    WBC: { name: "Agit Kabayel", record: "27–0", ko: 19, since: "2026-06-27" },
    IBF: { name: "Filip Hrgović", record: "21–1", ko: 16, since: "2026-08-29" },
    WBO: { name: "Daniel Dubois", record: "24–3", ko: 23, since: "2026-05-09" },
    Ring: { name: "Oleksandr Usyk", record: "25–0", ko: 16, since: "2022-08-20" },
  } },
  { division: "Bridgerweight", belts: {
    WBA: null,
    WBC: { name: "Ryad Merhy", record: "36–3", ko: 29, since: "2026-05-30" },
    IBF: null,
    WBO: null,
    Ring: null,
  } },
  { division: "Cruiserweight", belts: {
    WBA: { name: "David Benavidez", record: "32–0", ko: 26, since: "2026-05-02" },
    WBC: { name: "Michał Cieślak", record: "28–2", ko: 22, since: "2025-06-28" },
    IBF: null,
    WBO: { name: "David Benavidez", record: "32–0", ko: 26, since: "2026-05-02" },
    Ring: { name: "Jai Opetaia", record: "31–0", ko: 24, since: "2022-07-02" },
  } },
  { division: "Light heavyweight", belts: {
    WBA: { name: "Dmitry Bivol", record: "25–1", ko: 12, since: "2025-02-22" },
    WBC: null,
    IBF: { name: "Dmitry Bivol", record: "25–1", ko: 12, since: "2025-02-22" },
    WBO: { name: "Dmitry Bivol", record: "25–1", ko: 12, since: "2025-02-22" },
    Ring: { name: "Dmitry Bivol", record: "25–1", ko: 12, since: "2025-02-22" },
  } },
  { division: "Super middleweight", belts: {
    WBA: { name: "Jaime Munguia", record: "46–2", ko: 35, since: "2026-05-02" },
    WBC: { name: "Christian M'billi", record: "29–0–1", ko: 24, since: "2026-01-27" },
    IBF: { name: "Osleys Iglesias", record: "16–0", ko: 15, since: "2026-04-09" },
    WBO: null,
    Ring: null,
  } },
  { division: "Middleweight", belts: {
    WBA: { name: "Erislandy Lara", record: "32–3–3", ko: 19, since: "2021-05-01" },
    WBC: { name: "Carlos Adames", record: "25–1–1", ko: 18, since: "2024-05-07" },
    IBF: { name: "Aaron McKenna", record: "21–0", ko: 10, since: "2026-08-08" },
    WBO: null,
    Ring: null,
  } },
  { division: "Super welterweight", belts: {
    WBA: { name: "Jaron Ennis", record: "36–0", ko: 32, since: "2026-06-27" },
    WBC: { name: "Sebastian Fundora", record: "25–1–1", ko: 17, since: "2024-03-30" },
    IBF: { name: "Josh Kelly", record: "18–1–1", ko: 9, since: "2026-01-31" },
    WBO: { name: "Jaron Ennis", record: "36–0", ko: 32, since: "2026-06-27" },
    Ring: null,
  } },
  { division: "Welterweight", belts: {
    WBA: { name: "Teofimo Lopez", record: "23–2", ko: 13, since: "2026-08-22" },
    WBC: { name: "Ryan Garcia", record: "26–2", ko: 21, since: "2026-02-22" },
    IBF: { name: "Liam Paro", record: "28–1", ko: 16, since: "2026-06-24" },
    WBO: { name: "Devin Haney", record: "33–0", ko: 15, since: "2025-11-22" },
    Ring: null,
  } },
  { division: "Super lightweight", belts: {
    WBA: { name: "Gary Antuanne Russell", record: "19–1", ko: 17, since: "2025-03-01" },
    WBC: { name: "Dalton Smith", record: "20–0", ko: 14, since: "2026-01-10" },
    IBF: null,
    WBO: { name: "Shakur Stevenson", record: "25–0", ko: 11, since: "2026-01-31" },
    Ring: { name: "Shakur Stevenson", record: "25–0", ko: 11, since: "2026-01-31" },
  } },
  { division: "Lightweight", belts: {
    WBA: { name: "Floyd Schofield", record: "20–0", ko: 13, since: "2026-10-10" },
    WBC: { name: "William Zepeda", record: "34–1", ko: 27, since: "2026-08-01" },
    IBF: null,
    WBO: { name: "Abdullah Mason", record: "21–0", ko: 18, since: "2025-11-22" },
    Ring: null,
  } },
  { division: "Super featherweight", belts: {
    WBA: { name: "Anthony Cacace", record: "26–1", ko: 9, since: "2026-03-14" },
    WBC: { name: "O'Shaquie Foster", record: "26–3", ko: 12, since: "2024-11-02" },
    IBF: { name: "O'Shaquie Foster", record: "26–3", ko: 12, since: "2026-10-24" },
    WBO: { name: "O'Shaquie Foster", record: "26–3", ko: 12, since: "2026-10-24" },
    Ring: { name: "O'Shaquie Foster", record: "26–3", ko: 12, since: "2026-10-24" },
  } },
  { division: "Featherweight", belts: {
    WBA: null,
    WBC: { name: "Bruce Carrington", record: "18–0", ko: 10, since: "2026-01-31" },
    IBF: { name: "Angelo Leo", record: "26–1", ko: 12, since: "2024-08-10" },
    WBO: { name: "Rafael Espinoza", record: "28–0", ko: 24, since: "2023-12-09" },
    Ring: null,
  } },
  { division: "Super bantamweight", belts: {
    WBA: { name: "Naoya Inoue", record: "33–0", ko: 27, since: "2023-12-26" },
    WBC: { name: "Naoya Inoue", record: "33–0", ko: 27, since: "2023-07-25" },
    IBF: { name: "Naoya Inoue", record: "33–0", ko: 27, since: "2023-12-26" },
    WBO: { name: "Naoya Inoue", record: "33–0", ko: 27, since: "2023-07-25" },
    Ring: { name: "Naoya Inoue", record: "33–0", ko: 27, since: "2023-12-26" },
  } },
  { division: "Bantamweight", belts: {
    WBA: { name: "Jesse Rodriguez", record: "24–0", ko: 17, since: "2026-06-13" },
    WBC: { name: "Takuma Inoue", record: "23–2", ko: 5, since: "2025-11-24" },
    IBF: { name: "José Salas", record: "17–0", ko: 11, since: "2025-12-13" },
    WBO: { name: "Christian Medina", record: "27–4", ko: 19, since: "2025-09-14" },
    Ring: null,
  } },
  { division: "Super flyweight", belts: {
    WBA: { name: "David Jiménez", record: "18–1", ko: 12, since: "2024-04-20" },
    WBC: { name: "Ricardo Malajika", record: "18–2", ko: 12, since: "2026-09-27" },
    IBF: { name: "Andrew Moloney", record: "29–4", ko: 18, since: "2026-06-06" },
    WBO: { name: "Kenshiro Teraji", record: "26–2", ko: 16, since: "2026-07-20" },
    Ring: null,
  } },
  { division: "Flyweight", belts: {
    WBA: { name: "Sergio Mendoza", record: "28–1", ko: 24, since: "2026-10-10" },
    WBC: { name: "Sergio Mendoza", record: "28–1", ko: 24, since: "2026-10-10" },
    IBF: { name: "Masamichi Yabuki", record: "20–4", ko: 18, since: "2025-03-29" },
    WBO: { name: "Anthony Olascuaga", record: "12–1", ko: 9, since: "2024-07-20" },
    Ring: null,
  } },
  { division: "Light flyweight", belts: {
    WBA: { name: "René Santiago", record: "16–4", ko: 9, since: "2026-09-30" },
    WBC: { name: "Shokichi Iwata", record: "17–2", ko: 14, since: "2026-03-15" },
    IBF: { name: "Thanongsak Simsri", record: "41–1", ko: 36, since: "2025-06-19" },
    WBO: { name: "René Santiago", record: "16–4", ko: 9, since: "2025-03-13" },
    Ring: null,
  } },
  { division: "Minimumweight", belts: {
    WBA: { name: "Oscar Collazo", record: "15–0", ko: 12, since: "2024-11-16" },
    WBC: { name: "Siyakholwa Kuse", record: "10–3–1", ko: 4, since: "2026-05-16" },
    IBF: { name: "Pedro Taduran", record: "20–4–1", ko: 14, since: "2024-07-28" },
    WBO: { name: "Oscar Collazo", record: "15–0", ko: 12, since: "2023-05-27" },
    Ring: { name: "Oscar Collazo", record: "15–0", ko: 12, since: "2024-11-16" },
  } },
];

export function parseRecord(record) {
  const [w = 0, l = 0, d = 0] = String(record).split(/[–-]/).map((n) => parseInt(n, 10) || 0);
  return { w, l, d };
}

// A division is undisputed when one fighter holds all four major belts.
export function isUndisputed(div) {
  const names = MAJOR_BODIES.map((b) => div.belts[b]?.name);
  return names.every((n) => n && n === names[0]);
}

// One entry per fighter per division, with every belt they hold there.
// Sorted by number of major belts, then The Ring, then wins.
export function championsFrom(divisions = BOXING_DIVISIONS) {
  const map = new Map();
  for (const div of divisions) {
    for (const body of BODIES) {
      const b = div.belts[body];
      if (!b) continue;
      const key = `${b.name}|${div.division}`;
      if (!map.has(key)) {
        const rec = parseRecord(b.record);
        map.set(key, {
          id: key, name: b.name, division: div.division, record: rec, recordText: b.record,
          ko: b.ko, koRate: rec.w ? Math.round((b.ko / rec.w) * 100) : 0,
          belts: [], undisputed: isUndisputed(div),
        });
      }
      map.get(key).belts.push({ body, since: b.since });
    }
  }
  const majors = (c) => c.belts.filter((x) => x.body !== "Ring").length;
  const ring = (c) => (c.belts.some((x) => x.body === "Ring") ? 1 : 0);
  return [...map.values()].sort((a, b) => majors(b) - majors(a) || ring(b) - ring(a) || b.record.w - a.record.w);
}

// Most recent title wins across all divisions, newest first. Belts won by
// the same fighter in the same division on the same day are one entry.
export function latestTitleChanges(divisions = BOXING_DIVISIONS, limit = 6) {
  const map = new Map();
  for (const div of divisions) {
    for (const body of BODIES) {
      const b = div.belts[body];
      if (!b) continue;
      const key = `${b.name}|${div.division}|${b.since}`;
      if (!map.has(key)) map.set(key, { name: b.name, division: div.division, since: b.since, bodies: [] });
      map.get(key).bodies.push(body);
    }
  }
  return [...map.values()].sort((a, b) => b.since.localeCompare(a.since)).slice(0, limit);
}
