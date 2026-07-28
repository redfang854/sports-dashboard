import { checkRateLimit } from "./_rateLimit.js";

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

  const params = new URLSearchParams();
  Object.entries(rest).forEach(([k, v]) => params.append(k, v));

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
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
