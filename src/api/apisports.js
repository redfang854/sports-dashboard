const BASE = "/api/apisports";

async function get(endpoint, params = {}) {
  const query = new URLSearchParams({ endpoint, ...params });
  const res = await fetch(`${BASE}?${query}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.response || [];
}

export const LEAGUE_IDS = { PL: 39, PD: 140, SA: 135, BL1: 78, FL1: 61 };
export const SEASON = 2024;

export async function fetchTeams(leagueCode) {
  const leagueId = LEAGUE_IDS[leagueCode];
  if (!leagueId) throw new Error("Unknown league");
  const data = await get("teams", { league: leagueId, season: SEASON });
  return data.map((t) => ({
    id: t.team.id, name: t.team.name, logo: t.team.logo,
    country: t.team.country, founded: t.team.founded,
    venue: t.venue?.name, city: t.venue?.city, capacity: t.venue?.capacity,
  }));
}

export async function fetchSquad(teamId) {
  const data = await get("players/squads", { team: teamId });
  if (!data[0]) return [];
  return data[0].players.map((p) => ({
    id: p.id, name: p.name, age: p.age,
    number: p.number, position: p.position, photo: p.photo,
  }));
}

export async function fetchPlayerStats(playerId) {
  const data = await get("players", { id: playerId, season: SEASON });
  if (!data[0]) return null;
  const p = data[0];
  const stats = p.statistics?.[0] || {};
  return {
    id: p.player.id, name: p.player.name, age: p.player.age,
    nationality: p.player.nationality, height: p.player.height,
    weight: p.player.weight, photo: p.player.photo, injured: p.player.injured,
    team: stats.team?.name, teamLogo: stats.team?.logo,
    appearances: stats.games?.appearences, minutes: stats.games?.minutes,
    position: stats.games?.position,
    rating: stats.games?.rating ? parseFloat(stats.games.rating).toFixed(2) : null,
    goals: stats.goals?.total || 0, assists: stats.goals?.assists || 0,
    yellowCards: stats.cards?.yellow || 0, redCards: stats.cards?.red || 0,
    passes: stats.passes?.total || 0, keyPasses: stats.passes?.key || 0,
    tackles: stats.tackles?.total || 0, saves: stats.goals?.saves || null,
  };
}

export async function fetchH2H(team1Id, team2Id) {
  const today = new Date().toISOString().slice(0, 10);
  const data = await get("fixtures/headtohead", {
    h2h: `${team1Id}-${team2Id}`,
    from: "2018-01-01",
    to: today,
  });
  return data.slice(0, 10).map((f) => ({
    id: f.fixture.id, date: f.fixture.date?.slice(0, 10),
    venue: f.fixture.venue?.name, status: f.fixture.status?.short,
    homeTeam: f.teams.home.name, homeLogo: f.teams.home.logo,
    homeScore: f.goals.home, awayTeam: f.teams.away.name,
    awayLogo: f.teams.away.logo, awayScore: f.goals.away,
    winner: f.teams.home.winner ? "home" : f.teams.away.winner ? "away" : "draw",
    competition: f.league.name,
  }));
}

export async function fetchTeamForm(teamId) {
  const today = new Date().toISOString().slice(0, 10);
  const from = new Date();
  from.setMonth(from.getMonth() - 3);
  const data = await get("fixtures", {
    team: teamId,
    from: from.toISOString().slice(0, 10),
    to: today,
    status: "FT",
  });
  return data.slice(-5).map((f) => {
    const isHome = f.teams.home.id === teamId;
    const myScore = isHome ? f.goals.home : f.goals.away;
    const oppScore = isHome ? f.goals.away : f.goals.home;
    const result = myScore > oppScore ? "W" : myScore < oppScore ? "L" : "D";
    return {
      date: f.fixture.date?.slice(0, 10),
      opponent: isHome ? f.teams.away.name : f.teams.home.name,
      result, score: `${myScore}–${oppScore}`,
      venue: isHome ? "H" : "A", competition: f.league.name,
    };
  });
}
