import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./AuthModal.module.css";

export default function ResetPasswordModal() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess("Password updated. You're all set.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.logoRow}>
          <span className={styles.logoA}>A</span>
          <span className={styles.logoPEX}>PEX</span>
        </div>
        <h2 className={styles.title}>Set a new password</h2>
        <p className={styles.sub}>Choose a new password for your account</p>

        {success ? (
          <div className={styles.successBox}>{success}</div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>New password</label>
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
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
