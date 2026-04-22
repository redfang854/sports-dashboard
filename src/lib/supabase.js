import { createClient } from "@supabase/supabase-js";

// Vite exposes VITE_ prefixed env vars via import.meta.env
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a safe fallback client that won't crash the app
// if env vars aren't set — auth/chat just won't work
export const supabase = (SUPABASE_URL && SUPABASE_ANON)
  ? createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

export const supabaseReady = !!(SUPABASE_URL && SUPABASE_ANON);
