import { createClient } from "@supabase/supabase-js";

// Server-only client using the service_role key — NEVER expose this to the browser.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verifies the bearer token sent from the client and checks it matches the admin email.
// Returns the verified user on success, or null on any failure.
export async function verifyAdmin(req) {
  // Fail closed: without a configured admin email, nobody is admin. (A
  // plain comparison would treat undefined === undefined as a match for a
  // user with no email, e.g. a phone-only account.)
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return null;

  const authHeader = req.headers?.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  let data, error;
  try {
    ({ data, error } = await supabaseAdmin.auth.getUser(token));
  } catch {
    return null; // Supabase unreachable or paused: deny rather than crash
  }
  if (error || !data?.user) return null;

  if (!data.user.email || data.user.email !== adminEmail) return null;

  return data.user;
}

export { supabaseAdmin };
