// 2026-style WRC season data. The figures live in snapshots/wrc.json, which
// `npm run update:snapshots` regenerates from Wikipedia (there is no free
// public WRC results API). This module adds the date logic the views use.
import snapshot from "./snapshots/wrc.json";

export const WRC_UPDATED = snapshot.updated;
export const WRC_SOURCE = snapshot.source;
export const WRC_SEASON = snapshot.season;
export const WRC_DRIVER_STANDINGS = snapshot.drivers;
export const WRC_MANUFACTURER_STANDINGS = snapshot.manufacturers;
// start/end are ISO dates; status is derived from them (see wrcRoundStatus).
export const WRC_CALENDAR = snapshot.calendar;

// "done" once the rally's final day has passed, "live" while it runs,
// "next" for the first future round, otherwise "upcoming". Dates are
// compared as YYYY-MM-DD strings in UTC so this is timezone-stable.
export function wrcRoundStatus(round, calendar = WRC_CALENDAR, today = new Date()) {
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
