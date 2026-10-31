import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./AdminLogin.module.css";

// supabase-js can occasionally deadlock on its internal navigator.locks
// session lock and never resolve the signIn promise, even though the
// network request itself succeeded (same root cause as the stuck-lock
// workaround in AdminView.jsx). Race the call against a timeout so the
// UI can never hang on "Signing in..." forever.
function withTimeout(promise, ms) {
  return Promise.race([
    promise.then((value) => ({ timedOut: false, value })),
    new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), ms)),
  ]);
}

// After a timeout, check whether supabase-js persisted a session to
// localStorage anyway — if so, the sign-in really succeeded underneath.
function hasStoredSession() {
  const key = Object.keys(localStorage).find(
    (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
  );
  if (!key) return false;
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return !!(parsed?.access_token || parsed?.currentSession?.access_token);
  } catch {
    return false;
  }
}

// Unlisted admin sign-in, rendered at /admin. There is no sign-up or
// password-reset flow: the admin account is managed in Supabase directly.
export default function AdminLogin({ adminEmail }) {
  const { user, supabaseReady, signInWithEmail, signOut } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await withTimeout(signInWithEmail(email, password), 8000);
      if (result.timedOut) {
        if (hasStoredSession()) { window.location.reload(); return; }
        setError("Sign-in is taking longer than expected. Refresh the page and try again.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const wrongAccount = user && user.email !== adminEmail;

  return (
    <div className={styles.page}>
      <div className={styles.modal}>
        <div className={styles.logoRow}>
          <span className={styles.logoA}>A</span>
          <span className={styles.logoPEX}>PEX</span>
        </div>
        <h2 className={styles.title}>Admin</h2>

        {!supabaseReady ? (
          <p className={styles.error}>Supabase is not configured for this build.</p>
        ) : wrongAccount ? (
          <>
            <p className={styles.signedInAs}>
              Signed in as {user.email}, which is not the admin account.
            </p>
            <button className={styles.submitBtn} onClick={signOut}>Sign out</button>
          </>
        ) : (
          <>
            <p className={styles.sub}>Sign in to manage site content</p>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input className={styles.input} type="email" autoComplete="username"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <input className={styles.input} type="password" autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
