import dns from 'node:dns';
import net from 'node:net';
dns.setDefaultResultOrder('ipv4first');
if (net.setDefaultAutoSelectFamily) net.setDefaultAutoSelectFamily(false);
import { neon } from '@neondatabase/serverless';
import { checkRateLimit } from './_rateLimit.js';

async function withRetry(fn, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

export default async function handler(req, res) {
  const allowed = await checkRateLimit(req, res, "f1-driver", { requests: 10, window: "60 s" });
  if (!allowed) return;
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'name required' });
  const sql = neon(process.env.POSTGRES_URL_NON_POOLING);
  const surname = name.split(' ').pop();

  let stats, champRows, greatRaces;
  try {
    stats = await withRetry(() => sql`
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
    `);

    if (!stats.length) {
      return res.status(200).json({ found: false });
    }

    champRows = await withRetry(() => sql`
      WITH season_totals AS (
        SELECT f.season, r.driver, SUM(r.points) AS pts
        FROM f1_results r
        JOIN f1_races f ON r.race_id = f.id
        GROUP BY f.season, r.driver
      ),
      ranked AS (
        SELECT season, driver, pts,
               RANK() OVER (PARTITION BY season ORDER BY pts DESC) AS rnk
        FROM season_totals
      )
      SELECT season FROM ranked
      WHERE rnk = 1 AND driver ILIKE ${`%${surname}%`}
    `);

    greatRaces = await withRetry(() => sql`
      SELECT f.race_name, f.season, f.country, r.position, r.points, r.status
      FROM f1_results r
      JOIN f1_races f ON r.race_id = f.id
      WHERE r.driver ILIKE ${`%${surname}%`}
        AND r.position = 1
      ORDER BY f.season DESC
      LIMIT 5
    `);
  } catch (err) {
    return res.status(500).json({ error: 'Database temporarily unreachable, please retry', detail: err.message });
  }

  const d = stats[0];
  const champCount = champRows.length;

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
