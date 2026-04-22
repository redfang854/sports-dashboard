export default async function handler(req, res) {
  const { comp } = req.query;
  if (!comp) return res.status(400).json({ error: "comp param required" });

  // Champions League requires paid plan — return static flag
  if (comp === "CL") {
    return res.status(200).json({ static: true });
  }

  try {
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/${comp}/standings`,
      { headers: { "X-Auth-Token": process.env.FOOTBALL_API_KEY } }
    );

    // Pass rate limit header through for client awareness
    const remaining = response.headers.get("X-Requests-Available-Minute");
    if (remaining) res.setHeader("X-Requests-Available-Minute", remaining);

    if (response.status === 403) {
      return res.status(403).json({ error: "Competition requires paid plan" });
    }
    if (response.status === 404) {
      return res.status(404).json({ error: "Competition not found or season not available" });
    }
    if (!response.ok) {
      return res.status(response.status).json({ error: `HTTP ${response.status}` });
    }

    const data = await response.json();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
