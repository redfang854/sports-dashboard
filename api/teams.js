export default async function handler(req, res) {
  const { endpoint, ...rest } = req.query;
  if (!endpoint) return res.status(400).json({ error: "endpoint required" });
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) return res.status(500).json({ error: "FOOTBALL_API_KEY not configured" });
  const params = new URLSearchParams();
  Object.entries(rest).forEach(([k, v]) => params.append(k, v));
  const url = `https://api.football-data.org/v4/${endpoint}${params.toString() ? "?" + params.toString() : ""}`;
  try {
    const response = await fetch(url, { headers: { "X-Auth-Token": key } });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || `HTTP ${response.status}` });
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=300");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
