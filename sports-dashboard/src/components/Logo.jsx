import styles from "./Logo.module.css";

export default function Logo({ size = "md" }) {
  const s = size === "sm" ? 28 : size === "lg" ? 56 : 38;

  return (
    <div className={styles.logo}>
      <svg
        viewBox="0 0 60 60"
        width={s}
        height={s}
        xmlns="http://www.w3.org/2000/svg"
        className={styles.mark}
        aria-hidden="true"
      >
        {/* Red triangle fill */}
        <polygon points="30,4 2,56 58,56" fill="#E24B4A" />
        {/* Dark cutout triangle */}
        <polygon points="30,20 12,52 48,52" fill="#0d0d0d" />
        {/* Red crossbar */}
        <line x1="18" y1="42" x2="42" y2="42" stroke="#E24B4A" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <div className={styles.text}>
        <span className={styles.wordmark}>
          <span className={styles.a}>A</span>
          <span className={styles.pex}>PEX</span>
        </span>
        <span className={styles.tagline}>Your edge in every sport</span>
      </div>
    </div>
  );
}
