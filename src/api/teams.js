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

// Cache for team name -> API-Football ID lookups
const asIdCache = {};

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

async function getASTeamId(teamName, leagueCode) {
  const cacheKey = `${leagueCode}:${teamName}`;
  if (asIdCache[cacheKey]) return asIdCache[cacheKey];

  const comp = COMPETITIONS[leagueCode];
  if (!comp) return null;

  try {
    const results = await getAS("teams", {
      name: teamName,
      league: comp.asId,
      season: comp.season,
    });
    if (results[0]?.team?.id) {
      asIdCache[cacheKey] = results[0].team.id;
      return results[0].team.id;
    }
  } catch (e) {
    console.warn("Team lookup failed:", e.message);
  }
  return null;
}

export async function fetchSquad(teamId, teamName, leagueCode) {
  try {
    const asId = await getASTeamId(teamName, leagueCode);
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
