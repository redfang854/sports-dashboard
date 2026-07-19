export default async function handler(req, res) {
  const { endpoint, ...rest } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: "endpoint param required" });
  }

  const key = process.env.CITO_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "CITO_API_KEY not configured on server" });
  }

  // Build query string from remaining params
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

    // Surface Cito-level errors clearly (their error shape: { success: false, error: { code, message } })
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
