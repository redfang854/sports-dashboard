import { checkRateLimit } from "./_rateLimit.js";

export default async function handler(req, res) {
  const allowed = await checkRateLimit(req, res, "player-photo", { requests: 200, window: "60 s" });
  if (!allowed) return;

  const { url } = req.query;
  if (!url || !url.startsWith("https://media.api-sports.io/")) {
    return res.status(400).json({ error: "Invalid URL" });
  }
  try {
    const upstream = await fetch(url, {
      headers: {
        "x-apisports-key": process.env.APISPORTS_KEY,
        "x-rapidapi-key": process.env.APISPORTS_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
    });
    if (!upstream.ok) return res.status(upstream.status).end();
    const buffer = await upstream.arrayBuffer();
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(buffer));
  } catch (e) {
    res.status(500).end();
  }
}
