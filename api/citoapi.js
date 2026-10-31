import { checkRateLimit } from "./_rateLimit.js";
import { isAllowedEndpoint, safeParams, CITO_ENDPOINTS } from "./_endpointGuard.js";

export default async function handler(req, res) {
  const allowed = await checkRateLimit(req, res, "citoapi", { requests: 30, window: "60 s" });
  if (!allowed) return;

  const { endpoint, ...rest } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: "endpoint param required" });
  }

  const key = process.env.CITO_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "CITO_API_KEY not configured on server" });
  }

  if (!isAllowedEndpoint(endpoint, CITO_ENDPOINTS)) {
    return res.status(400).json({ error: "endpoint not allowed" });
  }
  const params = safeParams(rest);
  if (!params) return res.status(400).json({ error: "invalid query parameters" });

  const url = `https://api.citoapi.com/api/v1/${endpoint}${params.toString() ? "?" + params.toString() : ""}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": key,
      },
    });

    const data = await response.json();

    if (data.success === false) {
      const errMsg = data.error?.message || "Cito API error";
      return res.status(400).json({ error: errMsg });
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json(data);

  } catch (err) {
    console.error("citoapi failed:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
