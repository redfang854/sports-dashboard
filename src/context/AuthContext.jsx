import { createContext, useContext, useEffect, useState } from "react";
import { supabase, supabaseReady } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (_event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id);
        else setProfile(null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
  }

  async function signUpWithEmail(email, password, username) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id, username: username || email.split("@")[0],
        email, avatar_url: null, created_at: new Date().toISOString(),
      });
    }
    return data;
  }

  async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setPasswordRecovery(false);
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async function signOut() {
    // Supabase's internal navigator.locks usage can occasionally leave a
    // stuck lock behind (most commonly seen in React StrictMode's dev-only
    // double-invoke of effects), which makes signOut() hang forever with no
    // error. Race it against a timeout so the UI never gets stuck: if the
    // real sign-out doesn't finish in time, we force local state to clear
    // anyway. The underlying call keeps running in the background and will
    // still revoke the session server-side once the lock frees up.
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000, { timedOut: true }));
    const result = await Promise.race([supabase.auth.signOut(), timeout]);

    if (result?.timedOut) {
      console.warn("signOut() timed out after 3s — forcing local sign-out state.");
      setUser(null);
      setProfile(null);
    }
  }

  async function updateUsername(username) {
    const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
    if (error) throw error;
    setProfile((p) => ({ ...p, username }));
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading, supabaseReady,
      signUpWithEmail, signInWithEmail, signInWithGoogle, signOut, updateUsername,
      resetPassword, updatePassword, passwordRecovery,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
