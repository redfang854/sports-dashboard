// ─── API-Football client (all calls go through /api/apisports proxy) ─────────

const BASE = "/api/apisports";

async function get(endpoint, params = {}) {
  const query = new URLSearchParams({ endpoint, ...params });
  const res = await fetch(`${BASE}?${query}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.response || [];
}

// League ID map (API-Football IDs)
export const LEAGUE_IDS = {
  PL: 39, PD: 140, SA: 135, BL1: 78, FL1: 61,
};

export const SEASON = 2024;

/**
 * Get all teams in a league with their IDs and crests
 */
export async function fetchTeams(leagueCode) {
  const leagueId = LEAGUE_IDS[leagueCode];
  if (!leagueId) throw new Error("Unknown league");
  const data = await get("teams", { league: leagueId, season: SEASON });
  return data.map((t) => ({
    id:        t.team.id,
    name:      t.team.name,
    shortName: t.team.name,
    logo:      t.team.logo,
    country:   t.team.country,
    founded:   t.team.founded,
    venue:     t.venue?.name,
    city:      t.venue?.city,
    capacity:  t.venue?.capacity,
  }));
}

/**
 * Get full squad for a team (names + photos + positions)
 */
export async function fetchSquad(teamId) {
  const data = await get("players/squads", { team: teamId });
  if (!data[0]) return [];
  return data[0].players.map((p) => ({
    id:       p.id,
    name:     p.name,
    age:      p.age,
    number:   p.number,
    position: p.position,
    photo:    p.photo,
  }));
}

/**
 * Get player stats for current season
 */
export async function fetchPlayerStats(playerId, leagueId) {
  const data = await get("players", { id: playerId, season: SEASON });
  if (!data[0]) return null;
  const p = data[0];
  const stats = p.statistics?.[0] || {};
  return {
    id:          p.player.id,
    name:        p.player.name,
    firstname:   p.player.firstname,
    lastname:    p.player.lastname,
    age:         p.player.age,
    nationality: p.player.nationality,
    height:      p.player.height,
    weight:      p.player.weight,
    photo:       p.player.photo,
    injured:     p.player.injured,
    team:        stats.team?.name,
    teamLogo:    stats.team?.logo,
    appearances: stats.games?.appearences,
    minutes:     stats.games?.minutes,
    position:    stats.games?.position,
    rating:      stats.games?.rating
      ? parseFloat(stats.games.rating).toFixed(2) : null,
    goals:       stats.goals?.total || 0,
    assists:     stats.goals?.assists || 0,
    yellowCards: stats.cards?.yellow || 0,
    redCards:    stats.cards?.red || 0,
    passes:      stats.passes?.total || 0,
    keyPasses:   stats.passes?.key || 0,
    tackles:     stats.tackles?.total || 0,
    saves:       stats.goals?.saves || null,
  };
}

/**
 * Get head-to-head history between two teams
 */
export async function fetchH2H(team1Id, team2Id) {
  const data = await get("fixtures/headtohead", {
    h2h: `${team1Id}-${team2Id}`,
    last: 10,
  });
  return data.map((f) => ({
    id:        f.fixture.id,
    date:      f.fixture.date?.slice(0, 10),
    venue:     f.fixture.venue?.name,
    status:    f.fixture.status?.short,
    homeTeam:  f.teams.home.name,
    homeLogo:  f.teams.home.logo,
    homeScore: f.goals.home,
    awayTeam:  f.teams.away.name,
    awayLogo:  f.teams.away.logo,
    awayScore: f.goals.away,
    winner:    f.teams.home.winner ? "home"
             : f.teams.away.winner ? "away" : "draw",
    competition: f.league.name,
  }));
}

/**
 * Get last N fixtures for a team (for form calculation)
 */
export async function fetchTeamForm(teamId, last = 5) {
  const data = await get("fixtures", {
    team: teamId,
    last,
    status: "FT",
  });
  return data.map((f) => {
    const isHome   = f.teams.home.id === teamId;
    const myScore  = isHome ? f.goals.home  : f.goals.away;
    const oppScore = isHome ? f.goals.away  : f.goals.home;
    const result   = myScore > oppScore ? "W"
                   : myScore < oppScore ? "L" : "D";
    return {
      date:       f.fixture.date?.slice(0, 10),
      opponent:   isHome ? f.teams.away.name : f.teams.home.name,
      oppLogo:    isHome ? f.teams.away.logo : f.teams.home.logo,
      result,
      score:      `${myScore}–${oppScore}`,
      venue:      isHome ? "H" : "A",
      competition: f.league.name,
    };
  });
}
