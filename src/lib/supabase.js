import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn("Supabase env vars missing — auth and chat will not work.");
}

export const supabase = createClient(
  SUPABASE_URL  || "https://placeholder.supabase.co",
  SUPABASE_ANON || "placeholder"
);
