import { neon } from "@neondatabase/serverless";
import { verifyAdmin } from "./_supabaseAdmin.js";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { page } = req.query;
    if (!page) return res.status(400).json({ error: "page param required" });
    try {
      const rows = await sql`
        SELECT title, subtitle, image_url, cta_label, cta_link
        FROM hero_sections
        WHERE page_key = ${page}
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

    const { page_key, title, subtitle, image_url, cta_label, cta_link } = req.body || {};
    if (!page_key || !title) {
      return res.status(400).json({ error: "page_key and title are required" });
    }

    try {
      await sql`
        INSERT INTO hero_sections (page_key, title, subtitle, image_url, cta_label, cta_link)
        VALUES (${page_key}, ${title}, ${subtitle || null}, ${image_url || null}, ${cta_label || null}, ${cta_link || null})
        ON CONFLICT (page_key) DO UPDATE SET
          title = EXCLUDED.title,
          subtitle = EXCLUDED.subtitle,
          image_url = EXCLUDED.image_url,
          cta_label = EXCLUDED.cta_label,
          cta_link = EXCLUDED.cta_link,
          updated_at = NOW()
      `;
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
