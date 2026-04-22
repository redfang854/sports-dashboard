export default async function handler(req, res) {
  const { endpoint, ...rest } = req.query;
  if (!endpoint) return res.status(400).json({ error: "endpoint param required" });

  const key = process.env.API_SPORTS_KEY;
  if (!key) return res.status(500).json({ error: "API_SPORTS_KEY not configured" });

  const params = new URLSearchParams();
  Object.entries(rest).forEach(([k, v]) => params.append(k, v));

  const url = `https://v3.football.api-sports.io/${endpoint}${params.toString() ? "?" + params.toString() : ""}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "x-apisports-key": key },
    });
    const data = await response.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
      return res.status(400).json({ error: Object.values(data.errors).join(", ") });
    }
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
