export default async function handler(req, res) {
  const { endpoint, ...rest } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: "endpoint param required" });
  }

  const key = process.env.API_SPORTS_KEY;
  if (!key) {
    return res.status(500).json({ error: "API_SPORTS_KEY not configured on server" });
  }

  // Build query string from remaining params
  const params = new URLSearchParams();
  Object.entries(rest).forEach(([k, v]) => params.append(k, v));

  const url = `https://v3.football.api-sports.io/${endpoint}${params.toString() ? "?" + params.toString() : ""}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-apisports-key": key,
      },
    });

    const data = await response.json();

    // Surface API-level errors clearly
    if (data.errors && Object.keys(data.errors).length > 0) {
      const errMsg = Object.values(data.errors).join(", ");
      return res.status(400).json({ error: errMsg });
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
