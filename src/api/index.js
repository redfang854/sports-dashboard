// ─── API ENDPOINTS ────────────────────────────────────────────────────────────

const SPORTSDB = "https://www.thesportsdb.com/api/v1/json/3";
const JOLPICA  = "https://api.jolpi.ca/ergast/f1";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

// ─── MMA (legacy TheSportsDB — kept for reference, no longer used by MmaView) ──

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

// ─── MMA (Cito API — live, used by MmaView) ────────────────────────────────────

const CITO_BASE = "/api/citoapi";

async function getCito(endpoint, params = {}) {
  const query = new URLSearchParams({ endpoint, ...params });
  const res = await fetch(`${CITO_BASE}?${query}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return data.data ?? data;
}

// Turn a Cito bout method string ("Decision - Unanimous", "KO/TKO", "Submission")
// into our simplified UI categories.
function classifyMethod(method) {
  const m = (method || "").toLowerCase();
  if (m.includes("decision")) return { label: "Dec", methodType: "decision" };
  if (m.includes("submission")) return { label: "Sub", methodType: "finish" };
  if (m.includes("ko") || m.includes("tko")) return { label: "KO", methodType: "finish" };
  return { label: method || "—", methodType: "finish" };
}

function mapBoutToFight(b, eventTitle) {
  const winner = b.fighters?.find((f) => f.outcome === "win")
    || b.fighters?.find((f) => f.fighterSlug === b.winnerFighterSlug);
  const loser = b.fighters?.find((f) => f.outcome === "loss");
  const { label, methodType } = classifyMethod(b.method);

  return {
    fighterId: b.id,
    event: eventTitle,
    winner: winner?.fighterName || "—",
    loser: loser?.fighterName || "—",
    method: label,
    methodType,
    round: b.resultRound ? `R${b.resultRound}` : "—",
    time: b.resultTime || "—",
    title: !!b.titleBout,
    // Raw fighter records kept for the fighter-profile modal
    winnerProfile: winner ? {
      id: winner.fighterSlug,
      name: winner.fighterName,
      nickname: winner.nickname,
      record: winner.recordText,
      country: winner.country,
      division: winner.division,
      image: winner.imageUrl || winner.headshotUrl,
    } : null,
    loserProfile: loser ? {
      id: loser.fighterSlug,
      name: loser.fighterName,
      nickname: loser.nickname,
      record: loser.recordText,
      country: loser.country,
      division: loser.division,
      image: loser.imageUrl || loser.headshotUrl,
    } : null,
  };
}

/**
 * Fetch results grouped by event for the most recent COMPLETED UFC cards.
 * Cito's own "recent" list mixes in future-dated events still marked
 * "completed" (a data quality quirk on their end), so we filter to
 * status === "completed" AND startsAt actually in the past, then take
 * the most recent `maxEvents` by date.
 * Returns: [{ event, date, fights: [...] }]
 */
export async function fetchUFCRecentResults(maxEvents = 3) {
  const events = await getCito("ufc/events/recent");
  const now = Date.now();

  const completedPast = (events || [])
    .filter((e) => e.status === "completed" && new Date(e.startsAt).getTime() <= now)
    .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt))
    .slice(0, maxEvents);

  const grouped = await Promise.all(
    completedPast.map(async (ev) => {
      const bouts = await getCito(`ufc/events/${ev.slug}/bouts`);
      const fights = (bouts || [])
        .filter((b) => b.status === "completed" && !b.isCancelled)
        .sort((a, c) => (a.boutOrder ?? 0) - (c.boutOrder ?? 0))
        .map((b) => mapBoutToFight(b, ev.title));
      return { event: ev.title, date: ev.startsAt, fights };
    })
  );

  return grouped.filter((g) => g.fights.length > 0);
}

/**
 * Fetch the next upcoming UFC card's full fight lineup.
 * Returns: { name, date, fights: [{ bout, division, card, date }] } or null
 */
export async function fetchUFCUpcomingCard(maxBouts = 10) {
  const events = await getCito("ufc/events/upcoming");
  const now = Date.now();

  const upcoming = (events || [])
    .filter((e) => new Date(e.startsAt).getTime() > now)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  const next = upcoming[0];
  if (!next) return null;

  const bouts = await getCito(`ufc/events/${next.slug}/bouts`);
  const fights = (bouts || [])
    .sort((a, b) => (a.boutOrder ?? 0) - (b.boutOrder ?? 0))
    .slice(0, maxBouts)
    .map((b) => {
      const f1 = b.fighters?.[0];
      const f2 = b.fighters?.[1];
      return {
        bout:     `${f1?.fighterName || "TBA"} vs ${f2?.fighterName || "TBA"}`,
        division: b.weightClass || "—",
        card:     `${b.cardSection || "Card"}${b.titleBout ? " — Title" : ""}`,
        date:     next.startsAt,
      };
    });

  return { name: next.title, date: next.startsAt, fights };
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
  const data = await get(`${JOLPICA}/current/results.json?limit=100`);
  const races = data?.MRData?.RaceTable?.Races || [];
  return races
    .filter((race) => race.Results?.length > 0)
    .sort((a, b) => parseInt(b.round) - parseInt(a.round))
    .slice(0, 5)
    .map((race) => ({
      round:   parseInt(race.round),
      name:    race.raceName,
      circuit: race.Circuit.circuitName,
      date:    race.date,
      winner:  `${race.Results[0].Driver.givenName} ${race.Results[0].Driver.familyName}`,
      team:    race.Results[0].Constructor.name,
      laps:    race.Results[0].laps,
    }));
}

/**
 * Fetch the FULL driver-by-driver results for the most recently completed race.
 * Returns { round, name, circuit, date, results: [...] } or null if none yet.
 */
export async function fetchF1LatestRaceResults() {
  const data = await get(`${JOLPICA}/current/last/results.json`);
  const race = data?.MRData?.RaceTable?.Races?.[0];
  if (!race) return null;

  return {
    round:   parseInt(race.round),
    name:    race.raceName,
    circuit: race.Circuit.circuitName,
    date:    race.date,
    results: (race.Results || []).map((r) => ({
      pos:      parseInt(r.position),
      driverId: r.Driver.driverId,
      name:     `${r.Driver.givenName} ${r.Driver.familyName}`,
      team:     r.Constructor.name,
      points:   parseFloat(r.points),
      status:   r.status,
      time:     r.Time?.time || null,
      laps:     parseInt(r.laps),
    })),
  };
}

/**
 * Fetch the upcoming F1 race schedule.
 */
export async function fetchF1Schedule() {
  const data = await get(`${JOLPICA}/current.json`);
  const races = data?.MRData?.RaceTable?.Races || [];
  const now   = Date.now();
  return races
    .filter((r) => new Date(`${r.date}T${r.time || "23:59:00Z"}`).getTime() > now)
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
