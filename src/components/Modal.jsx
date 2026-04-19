import { useEffect } from "react";
import styles from "./Modal.module.css";

export function FighterModal({ fighter, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!fighter) return null;
  const { name, nationality, division, record, age, reach, finishRate, lastResult, bio } = fighter;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        <div className={styles.header}>
          <div className={styles.avatar}>{name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
          <div>
            <h2 className={styles.name}>{name}</h2>
            <p className={styles.sub}>{nationality} · {division}</p>
          </div>
        </div>

        <div className={styles.recordRow}>
          <div className={styles.recBox} style={{ background: "#63992215", borderColor: "#63992240" }}>
            <span className={styles.recNum} style={{ color: "#639922" }}>{record.w}</span>
            <span className={styles.recLabel}>Wins</span>
          </div>
          <div className={styles.recBox} style={{ background: "#E24B4A15", borderColor: "#E24B4A40" }}>
            <span className={styles.recNum} style={{ color: "#E24B4A" }}>{record.l}</span>
            <span className={styles.recLabel}>Losses</span>
          </div>
          <div className={styles.recBox} style={{ background: "#88878015", borderColor: "#88878040" }}>
            <span className={styles.recNum} style={{ color: "#888780" }}>{record.d}</span>
            <span className={styles.recLabel}>Draws</span>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.stat}><span className={styles.statVal}>{age}</span><span className={styles.statLabel}>Age</span></div>
          <div className={styles.stat}><span className={styles.statVal}>{reach}</span><span className={styles.statLabel}>Reach</span></div>
          <div className={styles.stat}><span className={styles.statVal}>{finishRate}</span><span className={styles.statLabel}>Finish Rate</span></div>
          <div className={styles.stat}><span className={styles.statVal} style={{ fontSize: 13 }}>{lastResult}</span><span className={styles.statLabel}>Last Result</span></div>
        </div>

        <p className={styles.bio}>{bio}</p>
      </div>
    </div>
  );
}

export function DriverModal({ driver, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!driver) return null;
  const { name, team, nationality, age, pts, wins, podiums, color, bio } = driver;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        <div className={styles.header}>
          <div className={styles.avatar} style={{ background: color + "22", borderColor: color + "66", color }}>{name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
          <div>
            <h2 className={styles.name}>{name}</h2>
            <p className={styles.sub}>{nationality} · {team}</p>
          </div>
        </div>

        <div className={styles.recordRow}>
          <div className={styles.recBox} style={{ background: "#63992215", borderColor: "#63992240" }}>
            <span className={styles.recNum} style={{ color: "#639922" }}>{wins}</span>
            <span className={styles.recLabel}>Wins</span>
          </div>
          <div className={styles.recBox} style={{ background: "#37AADD15", borderColor: "#37AADD40" }}>
            <span className={styles.recNum} style={{ color: "#378ADD" }}>{podiums}</span>
            <span className={styles.recLabel}>Podiums</span>
          </div>
          <div className={styles.recBox} style={{ background: "#ffffff08", borderColor: "#ffffff20" }}>
            <span className={styles.recNum} style={{ color: "#e8e8e8" }}>{pts}</span>
            <span className={styles.recLabel}>Points</span>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.stat}><span className={styles.statVal}>{age}</span><span className={styles.statLabel}>Age</span></div>
          <div className={styles.stat}><span className={styles.statVal} style={{ fontSize: 13 }}>{team}</span><span className={styles.statLabel}>Constructor</span></div>
        </div>

        <p className={styles.bio}>{bio}</p>
      </div>
    </div>
  );
}
