import { useEffect, useState } from "react";
import styles from "./SplashScreen.module.css";

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState("enter"); // enter → hold → exit

  useEffect(() => {
    const hold  = setTimeout(() => setPhase("exit"),    2000);
    const done  = setTimeout(() => onComplete?.(),      2800);
    return () => { clearTimeout(hold); clearTimeout(done); };
  }, []);

  return (
    <div className={`${styles.splash} ${phase === "exit" ? styles.splashExit : ""}`}>
      <div className={styles.inner}>

        {/* ── LOGO MARK — animated triangle A ── */}
        <div className={styles.markWrap}>
          <svg viewBox="0 0 120 120" className={styles.markSvg} xmlns="http://www.w3.org/2000/svg">
            {/* Triangle outline draws in */}
            <polygon
              points="60,8 4,112 116,112"
              fill="none"
              stroke="#E24B4A"
              strokeWidth="6"
              strokeLinejoin="round"
              className={styles.triangle}
            />
            {/* Inner fill fades in */}
            <polygon
              points="60,24 16,104 104,104"
              fill="#E24B4A"
              className={styles.triangleFill}
            />
            {/* Cutout — dark inner triangle */}
            <polygon
              points="60,42 30,96 90,96"
              fill="#0d0d0d"
              className={styles.triangleCutout}
            />
            {/* Crossbar draws in */}
            <line
              x1="38" y1="80"
              x2="82" y2="80"
              stroke="#E24B4A"
              strokeWidth="6"
              strokeLinecap="round"
              className={styles.crossbar}
            />
            {/* Live pulse dot */}
            <circle cx="60" cy="60" r="4" fill="#E24B4A" className={styles.pulse} />
          </svg>
        </div>

        {/* ── WORDMARK ── */}
        <div className={styles.wordmark}>
          <span className={styles.letterA}>A</span>
          <span className={styles.letterP}>P</span>
          <span className={styles.letterE}>E</span>
          <span className={styles.letterX}>X</span>
        </div>

        {/* ── TAGLINE ── */}
        <p className={styles.tagline}>Your edge in every sport</p>

        {/* ── SPORT ICONS strip ── */}
        <div className={styles.sports}>
          {["⚽", "🏎️", "🥋", "🥊", "🏉", "🚗"].map((icon, i) => (
            <span key={i} className={styles.sportIcon} style={{ animationDelay: `${0.8 + i * 0.1}s` }}>
              {icon}
            </span>
          ))}
        </div>

        {/* ── Loading bar ── */}
        <div className={styles.barTrack}>
          <div className={styles.barFill} />
        </div>

      </div>
    </div>
  );
}
