import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./AuthModal.module.css";

export default function AuthModal({ onClose }) {
  const { signUpWithEmail, signInWithEmail, signInWithGoogle } = useAuth();
  const [mode,     setMode]     = useState("signin"); // signin | signup
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, username);
        setSuccess("Check your email to confirm your account, then sign in.");
      } else {
        await signInWithEmail(email, password);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.logoRow}>
          <span className={styles.logoA}>A</span>
          <span className={styles.logoPEX}>PEX</span>
        </div>

        <h2 className={styles.title}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </h2>
        <p className={styles.sub}>
          {mode === "signin"
            ? "Join the APEX community"
            : "Start tracking every sport"}
        </p>

        {success ? (
          <div className={styles.successBox}>{success}</div>
        ) : (
          <>
            <button className={styles.googleBtn} onClick={handleGoogle}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className={styles.divider}><span>or</span></div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {mode === "signup" && (
                <div className={styles.field}>
                  <label className={styles.label}>Username</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="your_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                  />
                </div>
              )}
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <input
                  className={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <p className={styles.switchText}>
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button className={styles.switchBtn}
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}>
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
