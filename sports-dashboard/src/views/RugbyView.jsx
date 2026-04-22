import { useState } from "react";
import { SIX_NATIONS_2026, URC_STANDINGS_2026, PREMIERSHIP_STANDINGS_2026, RECENT_RUGBY } from "../data/rugby";
import styles from "./RugbyView.module.css";

const COMPS = [
  { id: "sixnations",    label: "Six Nations" },
  { id: "urc",          label: "URC" },
  { id: "premiership",  label: "Premiership" },
];

const posColor = (p) => p === 1 ? "#BA7517" : p === 2 ? "#999" : p === 3 ? "#7F77DD" : "#444";

function StandingsTable({ data, showGD = false }) {
  const top = data[0]?.pts ?? 1;
  return (
    <div>
      {data.map((t) => (
        <div key={t.team} className={styles.teamRow}>
          <span className={styles.pos} style={{ color: posColor(t.pos) }}>{t.pos}</span>
          <span className={styles.flag}>{t.flag}</span>
          <div className={styles.teamInfo}>
            <p className={styles.teamName}>{t.team}</p>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${Math.round((t.pts / top) * 100)}%`, background: t.color || "#639922" }} />
            </div>
          </div>
          <div className={styles.statsCols}>
            <span className={styles.stat}>{t.p}</span>
            <span className={styles.stat}>{t.w}</span>
            <span className={styles.stat}>{t.l}</span>
            <span className={styles.statBold}>{t.pts}</span>
          </div>
        </div>
      ))}
      <div className={styles.tableHeader}>
        <span style={{ width: 22 }} />
        <span style={{ width: 24 }} />
        <span style={{ flex: 1 }} />
        <div className={styles.statsCols}>
          <span className={styles.headerStat}>P</span>
          <span className={styles.headerStat}>W</span>
          <span className={styles.headerStat}>L</span>
          <span className={styles.headerStat}>Pts</span>
        </div>
      </div>
    </div>
  );
}

export default function RugbyView() {
  const [comp, setComp] = useState("sixnations");

  const standings = comp === "sixnations" ? SIX_NATIONS_2026
    : comp === "urc" ? URC_STANDINGS_2026
    : PREMIERSHIP_STANDINGS_2026;

  return (
    <div>
      <div className={styles.kpiRow}>
        {[
          { label: "Six Nations Winner", val: "Ireland",  sub: "2026 Grand Slam" },
          { label: "URC Leaders",        val: "Leinster", sub: "62 pts from 14" },
          { label: "Premiership Leaders",val: "Bath",     sub: "61 pts from 16" },
          { label: "World Champions",    val: "S. Africa",sub: "Rugby World Cup 2023" },
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
          <div className={styles.compTabs}>
            {COMPS.map((c) => (
              <button
                key={c.id}
                className={`${styles.compTab} ${comp === c.id ? styles.compTabActive : ""}`}
                onClick={() => setComp(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <StandingsTable data={standings} />
        </div>

        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Recent Results</h3>
          {RECENT_RUGBY.map((r, i) => (
            <div key={i} className={styles.resultRow}>
              <div className={styles.resultTeams}>
                <span className={styles.homeTeam}>{r.home}</span>
                <div className={styles.scoreBox}>
                  <span className={styles.score}>{r.homeScore}</span>
                  <span className={styles.scoreDash}>–</span>
                  <span className={styles.score}>{r.awayScore}</span>
                </div>
                <span className={styles.awayTeam}>{r.away}</span>
              </div>
              <div className={styles.resultMeta}>
                <span className={styles.competition}>{r.competition}</span>
                <span className={styles.date}>{r.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
