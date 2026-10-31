import { checkRateLimit } from "./_rateLimit.js";
import { isAllowedEndpoint, safeParams, API_FOOTBALL_ENDPOINTS } from "./_endpointGuard.js";

export default async function handler(req, res) {
  const { endpoint, ...rest } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: "endpoint param required" });
  }

  const allowed = await checkRateLimit(req, res, "apisports", { requests: 30, window: "60 s" });
  if (!allowed) return;

  const key = process.env.API_SPORTS_KEY;
  if (!key) {
    return res.status(500).json({ error: "API_SPORTS_KEY not configured on server" });
  }

  // Build query string from remaining params
  if (!isAllowedEndpoint(endpoint, API_FOOTBALL_ENDPOINTS)) {
    return res.status(400).json({ error: "endpoint not allowed" });
  }
  const params = safeParams(rest);
  if (!params) return res.status(400).json({ error: "invalid query parameters" });

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
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
