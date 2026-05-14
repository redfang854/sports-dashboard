import { neon } from '@neondatabase/serverless';

const DRIVER_DEBUTS = {
  hamilton:2007,alonso:2001,vettel:2007,schumacher:1991,button:2000,
  rosberg:2006,massa:2002,barrichello:1993,coulthard:1994,hill:1992,
  verstappen:2015,leclerc:2018,norris:2019,russell:2019,sainz:2015,
  piastri:2023,antonelli:2025,stroll:2017,gasly:2017,ocon:2016,
  albon:2019,tsunoda:2021,bottas:2013,zhou:2022,hulkenberg:2010,
  lawson:2023,
};

async function generateBio({ name, team, currentYear, seasonWins, seasonPodiums, seasonPoints, careerWins, careerChampionships, careerRaces }) {
  const apiKey = process.env.MOTORSPORT_API;
  if (!apiKey) return null;
  const prompt = `Write a 2-3 sentence current season overview for F1 driver ${name} who drives for ${team} in the ${currentYear} Formula 1 season. They have ${seasonWins} wins, ${seasonPodiums} podiums and ${seasonPoints} points so far this season. Career stats: ${careerChampionships} world championships, ${careerWins} race wins from ${careerRaces} starts. Be factual, concise and engaging. No markdown.`;
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: prompt }], max_tokens: 150, temperature: 0.7 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (_) { return null; }
}

export default async function handler(req, res) {
  const { name, team, seasonWins, seasonPodiums, seasonPoints } = req.query;
  if (!name) return res.status(400).json({ error: "name required" });
  const sql = neon(process.env.POSTGRES_URL);
  const parts = name.trim().split(" ");
  const surname = parts[parts.length - 1];
  const key = surname.toLowerCase();
  const debutYear = DRIVER_DEBUTS[key] ?? 1950;
  const currentYear = new Date().getFullYear();

  const stats = await sql`
    SELECT r.driver,
      COUNT(DISTINCT r.race_id) AS total_races,
      COUNT(*) FILTER (WHERE r.position = 1) AS wins,
      COUNT(*) FILTER (WHERE r.position <= 3) AS podiums,
      SUM(r.points) AS total_points,
      MIN(f.season) AS debut_season,
      MAX(f.season) AS last_season,
      COUNT(DISTINCT f.season) AS seasons
    FROM f1_results r
    JOIN f1_races f ON r.race_id = f.id
    WHERE r.driver = ${surname} AND f.season >= ${debutYear}
    GROUP BY r.driver LIMIT 1`;

  if (!stats.length) return res.status(200).json({ found: false });
  const d = stats[0];

  let extra = { wins: 0, podiums: 0, points: 0, races: 0 };
  try {
    const r = await fetch(`http://api.jolpi.ca/ergast/f1/${currentYear}/results.json?limit=1000`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const data = await r.json();
      for (const race of data?.MRData?.RaceTable?.Races ?? []) {
        for (const result of race.Results ?? []) {
          if (result.Driver?.familyName?.toLowerCase() === key) {
            extra.races++;
            extra.points += parseFloat(result.points ?? 0);
            const pos = parseInt(result.position);
            if (pos === 1) extra.wins++;
            if (pos <= 3) extra.podiums++;
          }
        }
      }
    }
  } catch (_) {}

  const totalWins    = Number(d.wins)         + extra.wins;
  const totalPodiums = Number(d.podiums)      + extra.podiums;
  const totalPoints  = Number(d.total_points) + extra.points;
  const totalRaces   = Number(d.total_races)  + extra.races;
  const lastSeason   = extra.races > 0 ? currentYear : Number(d.last_season);
  const seasons      = Number(d.seasons) + (extra.races > 0 ? 1 : 0);

  const seasonTotals = await sql`
    SELECT f.season FROM f1_results r
    JOIN f1_races f ON r.race_id = f.id
    WHERE r.driver = ${d.driver} AND f.season >= ${debutYear}
    GROUP BY f.season ORDER BY f.season DESC`;

  let champCount = 0;
  for (const s of seasonTotals) {
    const leader = await sql`
      SELECT r.driver, SUM(r.points) AS pts
      FROM f1_results r JOIN f1_races f ON r.race_id = f.id
      WHERE f.season = ${s.season}
      GROUP BY r.driver ORDER BY pts DESC LIMIT 1`;
    if (leader[0]?.driver === d.driver) champCount++;
  }

  const greatRaces = await sql`
    SELECT f.race_name, f.season, f.country
    FROM f1_results r JOIN f1_races f ON r.race_id = f.id
    WHERE r.driver = ${d.driver} AND r.position = 1 AND f.season >= ${debutYear}
    ORDER BY f.season DESC, f.round DESC LIMIT 5`;

  const bio = await generateBio({
    name, team: team ?? "", currentYear,
    seasonWins: parseInt(seasonWins ?? 0),
    seasonPodiums: parseInt(seasonPodiums ?? 0),
    seasonPoints: parseFloat(seasonPoints ?? 0),
    careerWins: totalWins,
    careerChampionships: champCount,
    careerRaces: totalRaces,
  });

  res.setHeader("Cache-Control", "s-maxage=3600");
  return res.status(200).json({
    found: true, driver: d.driver,
    totalRaces, wins: totalWins, podiums: totalPodiums, totalPoints,
    debutSeason: Number(d.debut_season), lastSeason, seasons,
    championships: champCount, bio,
    greatRaces: greatRaces.map(r => ({ name: r.race_name, season: r.season, country: r.country })),
  });
}