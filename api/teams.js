import { checkRateLimit } from "./_rateLimit.js";
import { isAllowedEndpoint, safeParams, FOOTBALL_DATA_ENDPOINTS } from "./_endpointGuard.js";

export default async function handler(req, res) {
  const allowed = await checkRateLimit(req, res, "teams", { requests: 60, window: "60 s" });
  if (!allowed) return;

  const { endpoint, ...rest } = req.query;
  if (!endpoint) return res.status(400).json({ error: "endpoint required" });
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) return res.status(500).json({ error: "FOOTBALL_API_KEY not configured" });
  if (!isAllowedEndpoint(endpoint, FOOTBALL_DATA_ENDPOINTS)) {
    return res.status(400).json({ error: "endpoint not allowed" });
  }
  const params = safeParams(rest);
  if (!params) return res.status(400).json({ error: "invalid query parameters" });
  const url = `https://api.football-data.org/v4/${endpoint}${params.toString() ? "?" + params.toString() : ""}`;
  try {
    const response = await fetch(url, { headers: { "X-Auth-Token": key } });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || `HTTP ${response.status}` });
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=300");
    return res.status(200).json(data);
  } catch (err) {
    console.error("teams failed:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
