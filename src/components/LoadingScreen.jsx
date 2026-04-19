import { useEffect, useState } from "react";
import styles from "./LoadingScreen.module.css";

export default function LoadingScreen({ onDone }) {
  const [phase, setPhase] = useState("enter"); // enter → bar → tagline → exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("bar"),     600);
    const t2 = setTimeout(() => setPhase("tagline"), 1200);
    const t3 = setTimeout(() => setPhase("exit"),    2000);
    const t4 = setTimeout(() => onDone(),            2600);
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
