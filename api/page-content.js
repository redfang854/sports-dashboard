import { neon } from "@neondatabase/serverless";
import { verifyAdmin } from "./_supabaseAdmin.js";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { page, section } = req.query;
    if (!page || !section) {
      return res.status(400).json({ error: "page and section params required" });
    }
    try {
      const rows = await sql`
        SELECT content, updated_at
        FROM page_content
        WHERE page_key = ${page} AND section_key = ${section}
      `;
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
      await sql`
        INSERT INTO page_content (page_key, section_key, content)
        VALUES (${page_key}, ${section_key}, ${content || ""})
        ON CONFLICT (page_key, section_key) DO UPDATE SET
          content = EXCLUDED.content,
          updated_at = NOW()
      `;
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
