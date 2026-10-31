import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getSupabase, hasStoredSession, supabaseReady } from "../lib/supabase";

// Auth is admin-only: there is no public sign-up, chat or profile system.
// The only reason to hold a session is to unlock the Admin CMS, whose API
// endpoints verify the bearer token server-side (api/_supabaseAdmin.js).
//
// Supabase is loaded lazily: only if a session was saved in this browser,
// or when someone signs in at /admin. Ordinary visitors never download it.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => supabaseReady && hasStoredSession());
  const unsubscribeRef = useRef(null);

  // Restore the session and follow sign-in/out events (idempotent).
  const connect = useCallback(async () => {
    const sb = await getSupabase();
    if (!sb) return null;
    if (!unsubscribeRef.current) {
      const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
      unsubscribeRef.current = () => subscription.unsubscribe();
    }
    return sb;
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (supabaseReady && hasStoredSession()) {
      connect()
        .then((sb) => sb?.auth.getSession())
        .then((res) => { if (!cancelled) setUser(res?.data?.session?.user ?? null); })
        .catch(() => { if (!cancelled) setUser(null); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }
    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [connect]);

  async function signInWithEmail(email, password) {
    const sb = await connect();
    if (!sb) throw new Error("Supabase is not configured");
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser(data?.user ?? null);
    return data;
  }

  async function signOut() {
    const sb = await getSupabase();
    if (!sb) { setUser(null); return; }
    // supabase-js can leave a stuck navigator.locks lock behind, making
    // signOut() hang with no error. Race it against a timeout and force
    // local state to clear; the real call still revokes server-side later.
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000, { timedOut: true }));
    const result = await Promise.race([sb.auth.signOut(), timeout]);
    if (result?.timedOut) console.warn("signOut() timed out after 3s — forcing local sign-out state.");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, supabaseReady, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Context modules conventionally export the provider and its hook together.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
