import { LEAGUE_COUNTRY, searchQueries, pickTeam } from "./teamMatch";

const FD_BASE = "/api/teams";
const AS_BASE = "/api/apisports";

async function getFD(endpoint, params = {}) {
  const query = new URLSearchParams({ endpoint, ...params });
  const res = await fetch(`${FD_BASE}?${query}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function getAS(endpoint, params = {}) {
  const query = new URLSearchParams({ endpoint, ...params });
  const res = await fetch(`${AS_BASE}?${query}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.response || [];
}

export const COMPETITIONS = {
  PL:  { id: 2021, name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", asId: 39,  season: 2024 },
  PD:  { id: 2014, name: "La Liga",        flag: "🇪🇸",         asId: 140, season: 2024 },
  SA:  { id: 2019, name: "Serie A",        flag: "🇮🇹",         asId: 135, season: 2024 },
  BL1: { id: 2002, name: "Bundesliga",     flag: "🇩🇪",         asId: 78,  season: 2024 },
  FL1: { id: 2015, name: "Ligue 1",        flag: "🇫🇷",         asId: 61,  season: 2024 },
};

// football-data team id -> API-Football team id. Kept in localStorage too:
// the mapping never changes and each lookup costs free-plan quota
// (100 requests/day), so a club is only ever looked up once per browser.
const asIdCache = {};
const AS_ID_KEY = (fdId) => `apex:asTeam:${fdId}`;
function readCachedId(fdId) {
  if (fdId in asIdCache) return asIdCache[fdId];
  try {
    const v = localStorage.getItem(AS_ID_KEY(fdId));
    if (v) return (asIdCache[fdId] = Number(v));
  } catch { /* storage unavailable */ }
  return undefined;
}
function writeCachedId(fdId, asId) {
  asIdCache[fdId] = asId;
  if (asId) { try { localStorage.setItem(AS_ID_KEY(fdId), String(asId)); } catch { /* ignore */ } }
}

export async function fetchTeams(leagueCode) {
  const comp = COMPETITIONS[leagueCode];
  if (!comp) throw new Error("Unknown league");
  const data = await getFD(`competitions/${comp.id}/teams`);
  return (data.teams || []).map((t) => ({
    id: t.id, name: t.name, short: t.shortName,
    crest: t.crest, founded: t.founded, venue: t.venue,
    website: t.website, colors: t.clubColors,
    leagueCode,
  }));
}

// Search API-Football by cleaned name (no season, so promoted clubs are
// found on the free plan) and score the results. Returns null if no
// confident match; the caller then falls back to football-data's squad.
async function getASTeamId(fdId, teamName, shortName, leagueCode) {
  const cached = readCachedId(fdId);
  if (cached !== undefined) return cached;

  const country = LEAGUE_COUNTRY[leagueCode];
  for (const q of searchQueries(teamName, shortName)) {
    try {
      const results = await getAS("teams", { search: q });
      const id = pickTeam(results, { fullName: teamName, shortName, country });
      if (id) { writeCachedId(fdId, id); return id; }
    } catch (e) {
      console.warn("Team lookup failed:", e.message);
      break; // quota/key problem: don't burn more requests
    }
  }
  writeCachedId(fdId, null); // remember the miss for this page session only
  return null;
}

export async function fetchSquad(teamId, teamName, leagueCode, shortName = "") {
  try {
    const asId = await getASTeamId(teamId, teamName, shortName, leagueCode);
    if (asId) {
      const data = await getAS("players/squads", { team: asId });
      if (data[0]?.players?.length) {
        return {
          usePhotos: true,
          squad: data[0].players.map((p) => ({
            id: p.id, name: p.name, age: p.age,
            number: p.number, position: p.position, photo: p.photo,
          })),
        };
      }
    }
  } catch (e) {
    console.warn("API-Football squad failed:", e.message);
  }

  // Fallback to football-data.org
  const data = await getFD(`teams/${teamId}`);
  return {
    usePhotos: false,
    squad: (data.squad || []).map((p) => ({
      id: p.id, name: p.name, position: p.position,
      dob: p.dateOfBirth, nationality: p.nationality,
    })),
  };
}

export async function fetchH2H(teamId) {
  const data = await getFD(`teams/${teamId}/matches`, { status: "FINISHED", limit: "10" });
  return (data.matches || []).slice(0, 10).map((m) => ({
    id: m.id, date: m.utcDate?.slice(0, 10),
    homeTeam: m.homeTeam.name, homeScore: m.score.fullTime.home,
    awayTeam: m.awayTeam.name, awayScore: m.score.fullTime.away,
    winner: m.score.winner, competition: m.competition.name,
  }));
}

export async function fetchH2HBetween(teamId1, teamId2) {
  const data = await getFD(`matches`, {
    competitions: Object.values(COMPETITIONS).map((c) => c.id).join(","),
    status: "FINISHED",
  });
  const matches = (data.matches || []).filter((m) => {
    const ids = [m.homeTeam.id, m.awayTeam.id];
    return ids.includes(teamId1) && ids.includes(teamId2);
  });
  return matches.map((m) => ({
    id: m.id,
    date: m.utcDate?.slice(0, 10),
    homeTeam: m.homeTeam.name,
    homeCrest: m.homeTeam.crest,
    homeScore: m.score.fullTime.home,
    awayTeam: m.awayTeam.name,
    awayCrest: m.awayTeam.crest,
    awayScore: m.score.fullTime.away,
    winner: m.score.winner,
    competition: m.competition.name,
  }));
}

export async function fetchFixtures(leagueCode) {
  const comp = COMPETITIONS[leagueCode];
  if (!comp) throw new Error("Unknown league");
  const data = await getFD(`competitions/${comp.id}/matches`, {
    status: "SCHEDULED",
  });
  return (data.matches || []).slice(0, 15).map((m) => ({
    id: m.id,
    date: m.utcDate,
    matchday: m.matchday,
    homeTeam: m.homeTeam.name,
    homeCrest: m.homeTeam.crest,
    awayTeam: m.awayTeam.name,
    awayCrest: m.awayTeam.crest,
  }));
}
