const BASE = "/api/teams";

async function get(endpoint, params = {}) {
  const query = new URLSearchParams({ endpoint, ...params });
  const res = await fetch(`${BASE}?${query}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const COMPETITIONS = {
  PL:  { id: 2021, name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  PD:  { id: 2014, name: "La Liga",        flag: "🇪🇸" },
  SA:  { id: 2019, name: "Serie A",        flag: "🇮🇹" },
  BL1: { id: 2002, name: "Bundesliga",     flag: "🇩🇪" },
  FL1: { id: 2015, name: "Ligue 1",        flag: "🇫🇷" },
};

export async function fetchTeams(leagueCode) {
  const comp = COMPETITIONS[leagueCode];
  if (!comp) throw new Error("Unknown league");
  const data = await get(`competitions/${comp.id}/teams`);
  return (data.teams || []).map((t) => ({
    id: t.id, name: t.name, short: t.shortName,
    crest: t.crest, founded: t.founded, venue: t.venue,
    website: t.website, colors: t.clubColors,
  }));
}

export async function fetchSquad(teamId) {
  const data = await get(`teams/${teamId}`);
  return {
    team: { id: data.id, name: data.name, crest: data.crest, founded: data.founded, venue: data.venue, colors: data.clubColors, coach: data.coach?.name },
    squad: (data.squad || []).map((p) => ({ id: p.id, name: p.name, position: p.position, dob: p.dateOfBirth, nationality: p.nationality })),
  };
}

export async function fetchH2H(teamId) {
  const data = await get(`teams/${teamId}/matches`, { status: "FINISHED", limit: "10" });
  return (data.matches || []).slice(0, 10).map((m) => ({
    id: m.id, date: m.utcDate?.slice(0, 10),
    homeTeam: m.homeTeam.name, homeCrest: m.homeTeam.crest,
    homeScore: m.score.fullTime.home, awayTeam: m.awayTeam.name,
    awayCrest: m.awayTeam.crest, awayScore: m.score.fullTime.away,
    winner: m.score.winner, competition: m.competition.name,
  }));
}
