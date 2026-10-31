// 2026 FIA World Rally Championship — manually maintained.
// There is no free public WRC results API, so this file is updated by
// hand. Bump WRC_UPDATED whenever the figures change; the page shows it.
// Source: FIA/WRC results as compiled on Wikipedia ("2026 World Rally
// Championship", revision of 27 Oct 2026). Rally Saudi Arabia (11–14 Nov)
// was removed from the calendar, so the season ended after Round 13.

export const WRC_UPDATED = "2026-10-27";
export const WRC_SOURCE = "FIA WRC results via Wikipedia";

const TOYOTA = "#CC0000", HYUNDAI = "#002C5F", MSPORT = "#003580";

export const WRC_DRIVER_STANDINGS_2026 = [
  { pos: 1,  name: "Elfyn Evans",      nationality: "🏴󠁧󠁢󠁷󠁬󠁳󠁿 Wales",       team: "Toyota",  car: "GR Yaris Rally1", pts: 243, color: TOYOTA },
  { pos: 2,  name: "Oliver Solberg",   nationality: "🇸🇪 Sweden",      team: "Toyota",  car: "GR Yaris Rally1", pts: 238, color: TOYOTA },
  { pos: 3,  name: "Sami Pajari",      nationality: "🇫🇮 Finland",     team: "Toyota",  car: "GR Yaris Rally1", pts: 237, color: TOYOTA },
  { pos: 4,  name: "Sébastien Ogier",  nationality: "🇫🇷 France",      team: "Toyota",  car: "GR Yaris Rally1", pts: 189, color: TOYOTA },
  { pos: 5,  name: "Adrien Fourmaux",  nationality: "🇫🇷 France",      team: "Hyundai", car: "i20 N Rally1",    pts: 183, color: HYUNDAI },
  { pos: 6,  name: "Takamoto Katsuta", nationality: "🇯🇵 Japan",       team: "Toyota",  car: "GR Yaris Rally1", pts: 175, color: TOYOTA },
  { pos: 7,  name: "Thierry Neuville", nationality: "🇧🇪 Belgium",     team: "Hyundai", car: "i20 N Rally1",    pts: 134, color: HYUNDAI },
  { pos: 8,  name: "Hayden Paddon",    nationality: "🇳🇿 New Zealand", team: "Hyundai", car: "i20 N Rally1",    pts: 38,  color: HYUNDAI },
  { pos: 9,  name: "Josh McErlean",    nationality: "🇮🇪 Ireland",     team: "M-Sport", car: "Puma Rally1",     pts: 35,  color: MSPORT },
  { pos: 10, name: "Esapekka Lappi",   nationality: "🇫🇮 Finland",     team: "Hyundai", car: "i20 N Rally1",    pts: 33,  color: HYUNDAI },
];

export const WRC_MANUFACTURER_STANDINGS_2026 = [
  { pos: 1, name: "Toyota Gazoo Racing WRT",  short: "Toyota",  pts: 662, color: TOYOTA },
  { pos: 2, name: "Hyundai Shell Mobis WRT",  short: "Hyundai", pts: 440, color: HYUNDAI },
  { pos: 3, name: "Toyota Gazoo Racing WRT2", short: "Toyota",  pts: 251, color: TOYOTA },
  { pos: 4, name: "M-Sport Ford WRT",         short: "M-Sport", pts: 168, color: MSPORT },
];

// start/end are ISO dates; status is derived from them (see wrcRoundStatus).
export const WRC_CALENDAR_2026 = [
  { round: 1,  name: "Rallye Monte-Carlo",   country: "🇲🇨 Monaco",   start: "2026-01-22", end: "2026-01-25", winner: "Solberg" },
  { round: 2,  name: "Rally Sweden",         country: "🇸🇪 Sweden",   start: "2026-02-12", end: "2026-02-15", winner: "Evans" },
  { round: 3,  name: "Safari Rally Kenya",   country: "🇰🇪 Kenya",    start: "2026-03-12", end: "2026-03-15", winner: "Katsuta" },
  { round: 4,  name: "Croatia Rally",        country: "🇭🇷 Croatia",  start: "2026-04-09", end: "2026-04-12", winner: "Katsuta" },
  { round: 5,  name: "Rally Islas Canarias", country: "🇪🇸 Spain",    start: "2026-04-23", end: "2026-04-26", winner: "Ogier" },
  { round: 6,  name: "Rally de Portugal",    country: "🇵🇹 Portugal", start: "2026-05-07", end: "2026-05-10", winner: "Neuville" },
  { round: 7,  name: "Rally Japan",          country: "🇯🇵 Japan",    start: "2026-05-28", end: "2026-05-31", winner: "Evans" },
  { round: 8,  name: "Acropolis Rally",      country: "🇬🇷 Greece",   start: "2026-06-25", end: "2026-06-28", winner: "Ogier" },
  { round: 9,  name: "Rally Estonia",        country: "🇪🇪 Estonia",  start: "2026-07-16", end: "2026-07-19", winner: "Pajari" },
  { round: 10, name: "Rally Finland",        country: "🇫🇮 Finland",  start: "2026-07-30", end: "2026-08-02", winner: "Pajari" },
  { round: 11, name: "Rally del Paraguay",   country: "🇵🇾 Paraguay", start: "2026-08-27", end: "2026-08-30", winner: "Pajari" },
  { round: 12, name: "Rally Chile",          country: "🇨🇱 Chile",    start: "2026-09-10", end: "2026-09-13", winner: "Solberg" },
  { round: 13, name: "Rally Italia Sardegna",country: "🇮🇹 Italy",    start: "2026-10-01", end: "2026-10-04", winner: "Solberg" },
];

// "done" once the rally's final day has passed, "live" while it runs,
// "next" for the first future round, otherwise "upcoming". Dates are
// compared as YYYY-MM-DD strings in UTC so this is timezone-stable.
export function wrcRoundStatus(round, calendar = WRC_CALENDAR_2026, today = new Date()) {
  const day = today.toISOString().slice(0, 10);
  if (day > round.end) return "done";
  if (day >= round.start) return "live";
  const next = calendar.find((r) => r.start > day);
  return next && next.round === round.round ? "next" : "upcoming";
}

const fmt = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
export function wrcDateRange(round) {
  return `${fmt(round.start)} – ${fmt(round.end)}`;
}
