// ─── API ENDPOINTS ────────────────────────────────────────────────────────────

const SPORTSDB = "https://www.thesportsdb.com/api/v1/json/3";
const JOLPICA  = "https://api.jolpi.ca/ergast/f1";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

// ─── MMA ──────────────────────────────────────────────────────────────────────

// TheSportsDB league IDs for MMA orgs
const UFC_LEAGUE_ID = "4443";

/**
 * Fetch recent + upcoming UFC events for the current year.
 * Returns { recent: Event[], upcoming: Event[] }
 */
export async function fetchUFCEvents() {
  const year = new Date().getFullYear();
  const data = await get(`${SPORTSDB}/eventsleague.php?id=${UFC_LEAGUE_ID}&s=${year}`);
  const events = data.events || [];

  const now = Date.now();

  const recent = events
    .filter((e) => new Date(e.dateEvent).getTime() < now && e.strResult)
    .slice(-6)
    .reverse();

  const upcoming = events
    .filter((e) => new Date(e.dateEvent).getTime() > now)
    .slice(0, 5);

  return { recent, upcoming };
}

/**
 * Fetch details for a single UFC event by ID.
 */
export async function fetchEventDetails(eventId) {
  const data = await get(`${SPORTSDB}/lookupevent.php?id=${eventId}`);
  return data.events?.[0] || null;
}

// ─── FORMULA 1 ────────────────────────────────────────────────────────────────

/**
 * Fetch current F1 Driver Championship standings.
 * Returns array of standing entries.
 */
export async function fetchF1DriverStandings() {
  const data = await get(`${JOLPICA}/current/driverStandings.json`);
  const list =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
  return list.map((entry) => ({
    pos:         parseInt(entry.position),
    points:      parseInt(entry.points),
    wins:        parseInt(entry.wins),
    driverId:    entry.Driver.driverId,
    name:        `${entry.Driver.givenName} ${entry.Driver.familyName}`,
    nationality: entry.Driver.nationality,
    team:        entry.Constructors[0]?.name || "—",
  }));
}

/**
 * Fetch current F1 Constructor Championship standings.
 */
export async function fetchF1ConstructorStandings() {
  const data = await get(`${JOLPICA}/current/constructorStandings.json`);
  const list =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];
  return list.map((entry) => ({
    pos:          parseInt(entry.position),
    points:       parseInt(entry.points),
    wins:         parseInt(entry.wins),
    constructorId: entry.Constructor.constructorId,
    name:         entry.Constructor.name,
    nationality:  entry.Constructor.nationality,
  }));
}

/**
 * Fetch the last 5 F1 race results for the current season.
 */
export async function fetchF1RecentRaces() {
  const data = await get(`${JOLPICA}/current/results.json?limit=5`);
  const races = data?.MRData?.RaceTable?.Races || [];
  return races.map((race) => ({
    round:    parseInt(race.round),
    name:     race.raceName,
    circuit:  race.Circuit.circuitName,
    date:     race.date,
    winner:   `${race.Results[0].Driver.givenName} ${race.Results[0].Driver.familyName}`,
    team:     race.Results[0].Constructor.name,
    laps:     race.Results[0].laps,
  }));
}

/**
 * Fetch the upcoming F1 race schedule.
 */
export async function fetchF1Schedule() {
  const data = await get(`${JOLPICA}/current.json`);
  const races = data?.MRData?.RaceTable?.Races || [];
  const now   = Date.now();
  return races
    .filter((r) => new Date(r.date).getTime() > now)
    .slice(0, 4)
    .map((r) => ({
      round:   parseInt(r.round),
      name:    r.raceName,
      circuit: r.Circuit.circuitName,
      date:    r.date,
      time:    r.time || "12:00:00Z",
      target:  `${r.date}T${r.time || "12:00:00Z"}`,
    }));
}
