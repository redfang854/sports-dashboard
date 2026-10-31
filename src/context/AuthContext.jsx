import { createContext, useContext, useEffect, useState } from "react";
import { supabase, supabaseReady } from "../lib/supabase";

// Auth is admin-only. There is no public sign-up, chat or profile system;
// the only reason to hold a session is to unlock the Admin CMS, whose
// API endpoints verify the bearer token server-side (api/_supabaseAdmin.js).
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    // supabase-js can leave a stuck navigator.locks lock behind, making
    // signOut() hang with no error. Race it against a timeout and force
    // local state to clear; the real call still revokes server-side later.
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000, { timedOut: true }));
    const result = await Promise.race([supabase.auth.signOut(), timeout]);
    if (result?.timedOut) {
      console.warn("signOut() timed out after 3s — forcing local sign-out state.");
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, supabaseReady, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
