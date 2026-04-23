import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseReady = !!(SUPABASE_URL && SUPABASE_ANON && SUPABASE_URL.startsWith("http"));

export const supabase = supabaseReady
  ? createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;
