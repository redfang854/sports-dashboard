import styles from "./StatusStates.module.css";

export function LoadingState({ message = "Loading live data..." }) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <p className={styles.message}>{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.container}>
      <p className={styles.errorIcon}>⚠</p>
      <p className={styles.message}>{message || "Failed to load data"}</p>
      {onRetry && (
        <button className={styles.retryBtn} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function LiveBadge() {
  return (
    <span className={styles.liveBadge}>
      <span className={styles.liveDot} />
      LIVE DATA
    </span>
  );
}
