import { useState } from "react";
import { BOXING_CHAMPIONS, RECENT_BOXING, UPCOMING_BOXING } from "../data/boxing";
import styles from "./BoxingView.module.css";

const BELT_COLORS = { WBC: "#007A33", WBA: "#CC0000", IBF: "#003580", WBO: "#6A0DAD" };

function ChampionModal({ champion, onClose }) {
  if (!champion) return null;
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <div className={styles.modalHeader}>
          <div className={styles.modalAvatar}>
            {champion.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h2 className={styles.modalName}>{champion.name}</h2>
            <p className={styles.modalSub}>{champion.nationality} · {champion.division}</p>
            <div className={styles.beltRow}>
              {champion.belts.map((b) => (
                <span key={b} className={styles.beltBadge} style={{ background: BELT_COLORS[b] + "22", color: BELT_COLORS[b], borderColor: BELT_COLORS[b] + "55" }}>{b}</span>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.recordRow}>
          <div className={styles.recBox} style={{ background: "#63992215", borderColor: "#63992240" }}>
            <span className={styles.recNum} style={{ color: "#639922" }}>{champion.record.w}</span>
            <span className={styles.recLabel}>Wins</span>
          </div>
          <div className={styles.recBox} style={{ background: "#E24B4A15", borderColor: "#E24B4A40" }}>
            <span className={styles.recNum} style={{ color: "#E24B4A" }}>{champion.record.l}</span>
            <span className={styles.recLabel}>Losses</span>
          </div>
          <div className={styles.recBox} style={{ background: "#88878015", borderColor: "#88878040" }}>
            <span className={styles.recNum} style={{ color: "#888" }}>{champion.record.d}</span>
            <span className={styles.recLabel}>Draws</span>
          </div>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.stat}><span className={styles.statVal}>{champion.age}</span><span className={styles.statLabel}>Age</span></div>
          <div className={styles.stat}><span className={styles.statVal}>{champion.reach}</span><span className={styles.statLabel}>Reach</span></div>
          <div className={styles.stat}><span className={styles.statVal}>{champion.finishRate}</span><span className={styles.statLabel}>KO Rate</span></div>
          <div className={styles.stat}><span className={styles.statVal} style={{ fontSize: 11 }}>{champion.status}</span><span className={styles.statLabel}>Status</span></div>
        </div>
        <p className={styles.bio}>{champion.bio}</p>
      </div>
    </div>
  );
}

export default function BoxingView() {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <div className={styles.kpiRow}>
        {[
          { label: "Undisputed Champions", val: "3", sub: "HW · S.WW · S.MW" },
          { label: "P4P #1", val: "Crawford", sub: "41-0 · Two-weight undisputed" },
          { label: "Biggest Fight", val: "Usyk vs Fury", sub: "Usyk wins by SD" },
          { label: "Next Up", val: "Canelo", sub: "vs Benavidez — TBA" },
        ].map((k) => (
          <div key={k.label} className={styles.kpi}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={styles.kpiVal}>{k.val}</p>
            <p className={styles.kpiSub}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>
            World Champions
            <span className={styles.hint}>click for profile</span>
          </h3>
          {BOXING_CHAMPIONS.map((c) => (
            <button key={c.id} className={styles.championRow} onClick={() => setSelected(c)}>
              <div className={styles.champAvatar}>
                {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className={styles.champInfo}>
                <p className={styles.champName}>{c.name}</p>
                <p className={styles.champDivision}>{c.division}</p>
                <div className={styles.beltRow}>
                  {c.belts.map((b) => (
                    <span key={b} className={styles.beltBadge} style={{ background: BELT_COLORS[b] + "22", color: BELT_COLORS[b], borderColor: BELT_COLORS[b] + "55" }}>{b}</span>
                  ))}
                </div>
              </div>
              <div className={styles.champRecord}>
                <span className={styles.recordBig}>{c.record.w}-{c.record.l}</span>
                <span className={styles.recordSub}>{c.nationality}</span>
              </div>
            </button>
          ))}
        </div>

        <div>
          <div className={styles.panel} style={{ marginBottom: 16 }}>
            <h3 className={styles.panelTitle}>Recent Fights</h3>
            {RECENT_BOXING.map((f, i) => (
              <div key={i} className={styles.fightRow}>
                <div>
                  <div className={styles.boutNames}>
                    <span className={styles.winner}>{f.winner}</span>
                    <span className={styles.vs}>def.</span>
                    <span className={styles.loser}>{f.loser}</span>
                  </div>
                  <p className={styles.boutDetail}>{f.division} · {f.date}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span className={styles.method}>{f.method}</span>
                  {f.title && <p className={styles.titleLabel}>TITLE</p>}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Upcoming Fights</h3>
            {UPCOMING_BOXING.map((f, i) => (
              <div key={i} className={styles.upcomingRow}>
                <div>
                  <p className={styles.upBout}>{f.bout}</p>
                  <p className={styles.upDetail}>{f.division}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className={styles.upDate}>{f.date}</p>
                  <span className={styles.statusBadge}>{f.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ChampionModal champion={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
