import { createClient } from "@supabase/supabase-js";

// Server-only client using the service_role key — NEVER expose this to the browser.
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verifies the bearer token sent from the client and checks it matches the admin email.
// Returns the verified user on success, or null on any failure.
export async function verifyAdmin(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;

  if (data.user.email !== process.env.ADMIN_EMAIL) return null;

  return data.user;
}

export { supabaseAdmin };
