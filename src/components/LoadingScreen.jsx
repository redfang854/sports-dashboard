import { useEffect, useState } from "react";
import styles from "./LoadingScreen.module.css";

export default function LoadingScreen({ onDone }) {
  const [phase, setPhase] = useState("enter"); // enter → bar → tagline → exit

  useEffect(() => {
    // Shown once per session (see App.jsx). Kept short: ~1.1s total, and
    // skipped entirely for visitors who ask for reduced motion.
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const t = setTimeout(() => onDone(), 0);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase("bar"),     250);
    const t2 = setTimeout(() => setPhase("tagline"), 500);
    const t3 = setTimeout(() => setPhase("exit"),    850);
    const t4 = setTimeout(() => onDone(),            1100);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className={`${styles.screen} ${phase === "exit" ? styles.exit : ""}`}>
      <div className={styles.center}>

        {/* Logo mark */}
        <div className={`${styles.logoWrap} ${phase !== "enter" ? styles.logoIn : ""}`}>
          <span className={styles.letterA}>A</span>
          <span className={styles.letterPEX}>PEX</span>
        </div>

        {/* Red underline bar — animates in after letters */}
        <div className={`${styles.bar} ${phase === "bar" || phase === "tagline" ? styles.barIn : ""}`} />

        {/* Tagline */}
        <p className={`${styles.tagline} ${phase === "tagline" ? styles.taglineIn : ""}`}>
          Your edge in every sport
        </p>

        {/* Loading dots */}
        <div className={`${styles.dots} ${phase === "tagline" ? styles.dotsIn : ""}`}>
          <span className={styles.dot} style={{ animationDelay: "0ms" }} />
          <span className={styles.dot} style={{ animationDelay: "160ms" }} />
          <span className={styles.dot} style={{ animationDelay: "320ms" }} />
        </div>

      </div>
    </div>
  );
}
