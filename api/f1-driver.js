import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'name required' });

  const sql = neon(process.env.POSTGRES_URL);

  // Search by surname (case-insensitive)
  const surname = name.split(' ').pop();

  const stats = await sql`
    SELECT
      r.driver,
      COUNT(DISTINCT r.race_id)                                         AS total_races,
      COUNT(*) FILTER (WHERE r.position = 1)                           AS wins,
      COUNT(*) FILTER (WHERE r.position <= 3)                          AS podiums,
      SUM(r.points)                                                     AS total_points,
      MIN(f.season)                                                     AS debut_season,
      MAX(f.season)                                                     AS last_season,
      COUNT(DISTINCT f.season)                                          AS seasons
    FROM f1_results r
    JOIN f1_races f ON r.race_id = f.id
    WHERE r.driver ILIKE ${`%${surname}%`}
    GROUP BY r.driver
    ORDER BY total_points DESC
    LIMIT 1
  `;

  if (!stats.length) {
    return res.status(200).json({ found: false });
  }

  const d = stats[0];

  // Get championships (seasons where driver won most points)
  const championships = await sql`
    SELECT f.season, SUM(r.points) AS season_points
    FROM f1_results r
    JOIN f1_races f ON r.race_id = f.id
    WHERE r.driver ILIKE ${`%${surname}%`}
    GROUP BY f.season
    ORDER BY f.season DESC
  `;

  // Determine championships by checking if driver had max points that season
  let champCount = 0;
  for (const s of championships) {
    const seasonLeader = await sql`
      SELECT r.driver, SUM(r.points) AS pts
      FROM f1_results r
      JOIN f1_races f ON r.race_id = f.id
      WHERE f.season = ${s.season}
      GROUP BY r.driver
      ORDER BY pts DESC
      LIMIT 1
    `;
    if (seasonLeader[0]?.driver?.toLowerCase().includes(surname.toLowerCase())) {
      champCount++;
    }
  }

  // Get best results — races where driver won or set fastest lap (position 1)
  const greatRaces = await sql`
    SELECT f.race_name, f.season, f.country, r.position, r.points, r.status
    FROM f1_results r
    JOIN f1_races f ON r.race_id = f.id
    WHERE r.driver ILIKE ${`%${surname}%`}
      AND r.position = 1
    ORDER BY f.season DESC
    LIMIT 5
  `;

  res.setHeader('Cache-Control', 's-maxage=3600');
  return res.status(200).json({
    found:           true,
    driver:          d.driver,
    totalRaces:      Number(d.total_races),
    wins:            Number(d.wins),
    podiums:         Number(d.podiums),
    totalPoints:     Number(d.total_points),
    debutSeason:     Number(d.debut_season),
    lastSeason:      Number(d.last_season),
    seasons:         Number(d.seasons),
    championships:   champCount,
    greatRaces:      greatRaces.map(r => ({
      name:    r.race_name,
      season:  r.season,
      country: r.country,
      points:  r.points,
    })),
  });
}
