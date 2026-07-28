import { neon } from "@neondatabase/serverless";
import { verifyAdmin } from "./_supabaseAdmin.js";
import { checkRateLimit } from "./_rateLimit.js";

const sql = neon(process.env.POSTGRES_URL_NON_POOLING);

async function withRetry(fn, attempts = 5) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.error(`withRetry attempt ${i + 1}/${attempts} failed:`, err.message);
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

export default async function handler(req, res) {
  const allowed = await checkRateLimit(req, res, "page-content", { requests: 60, window: "60 s" });
  if (!allowed) return;

  if (req.method === "GET") {
    const { page, section } = req.query;
    if (!page || !section) {
      return res.status(400).json({ error: "page and section params required" });
    }
    try {
      const rows = await withRetry(() => sql`
        SELECT content, updated_at
        FROM page_content
        WHERE page_key = ${page} AND section_key = ${section}
      `);
      if (rows.length === 0) return res.status(404).json({ error: "Not found" });
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
      return res.status(200).json(rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    const user = await verifyAdmin(req);
    if (!user) return res.status(403).json({ error: "Forbidden" });

    const { page_key, section_key, content } = req.body || {};
    if (!page_key || !section_key) {
      return res.status(400).json({ error: "page_key and section_key are required" });
    }

    try {
      await withRetry(() => sql`
        INSERT INTO page_content (page_key, section_key, content)
        VALUES (${page_key}, ${section_key}, ${content || ""})
        ON CONFLICT (page_key, section_key) DO UPDATE SET
          content = EXCLUDED.content,
          updated_at = NOW()
      `);
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
