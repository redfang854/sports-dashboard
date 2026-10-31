// Supabase is only needed by the admin (public visitors never sign in), so
// the client library is loaded on demand instead of in the main bundle.

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseReady = !!(SUPABASE_URL && SUPABASE_ANON && SUPABASE_URL.startsWith("http"));

let clientPromise = null;

/** Resolves to the Supabase client (created once), or null if not configured. */
export function getSupabase() {
  if (!supabaseReady) return Promise.resolve(null);
  clientPromise ||= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_ANON)
  );
  return clientPromise;
}

/** True if supabase-js has persisted a session in this browser (sb-<ref>-auth-token). */
export function hasStoredSession() {
  try {
    return Object.keys(localStorage).some((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
  } catch {
    return false;
  }
}
