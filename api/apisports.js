export default async function handler(req, res) {
  const { endpoint } = req.query;
  if (!endpoint) return res.status(400).json({ error: "endpoint param required" });

  // Build query string from all params except 'endpoint'
  const params = new URLSearchParams();
  Object.entries(req.query).forEach(([k, v]) => {
    if (k !== "endpoint") params.append(k, v);
  });

  const url = `https://v3.football.api-sports.io/${endpoint}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        "x-apisports-key": process.env.API_SPORTS_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `HTTP ${response.status}` });
    }

    const data = await response.json();

    // Check for API-level errors
    if (data.errors && Object.keys(data.errors).length > 0) {
      return res.status(400).json({ error: Object.values(data.errors)[0] });
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
