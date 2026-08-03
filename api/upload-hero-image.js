import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "./_supabaseAdmin.js";
import { checkRateLimit } from "./_rateLimit.js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HERO_BUCKET = "hero-images";
const MAX_BYTES = 3 * 1024 * 1024; // 3MB raw (~4MB once base64-encoded, safely under Vercel's default body limit)

export default async function handler(req, res) {
  const allowed = await checkRateLimit(req, res, "upload-hero-image", { requests: 20, window: "60 s" });
  if (!allowed) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await verifyAdmin(req);
  if (!user) return res.status(403).json({ error: "Forbidden" });

  try {
    const { page_key, filename, content_type, data_base64 } = req.body || {};

    if (!page_key || !filename || !content_type || !data_base64) {
      return res.status(400).json({ error: "page_key, filename, content_type, and data_base64 are required" });
    }
    if (!content_type.startsWith("image/")) {
      return res.status(400).json({ error: "content_type must be an image type" });
    }

    const buffer = Buffer.from(data_base64, "base64");
    if (buffer.length > MAX_BYTES) {
      return res.status(400).json({ error: `File too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB) — max 5MB` });
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${page_key}-${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(HERO_BUCKET)
      .upload(path, buffer, { contentType: content_type, upsert: true });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError.message);
      return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(HERO_BUCKET)
      .getPublicUrl(path);

    return res.status(200).json({ url: publicUrlData.publicUrl, path });
  } catch (err) {
    console.error("upload-hero-image error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
