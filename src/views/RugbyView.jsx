import { useState, useEffect } from "react";
import {
  SIX_NATIONS_2026, URC_STANDINGS_2026_27, PREMIERSHIP_STANDINGS_2026_27, RECENT_RUGBY,
  RUGBY_UPDATED, RUGBY_SOURCE,
} from "../data/rugby";
import UpdatedNote from "../components/UpdatedNote";
import styles from "./RugbyView.module.css";
import SportsRecents from "../components/SportsRecents";

const COMPS = [
  { id: "sixnations",  label: "Six Nations", season: "2026 · final table",   data: SIX_NATIONS_2026 },
  { id: "urc",         label: "URC",         season: "2026–27 · in progress", data: URC_STANDINGS_2026_27 },
  { id: "premiership", label: "Premiership", season: "2026–27 · in progress", data: PREMIERSHIP_STANDINGS_2026_27 },
];
const fmtDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

const posColor = (p) => p === 1 ? "#BA7517" : p === 2 ? "#999" : p === 3 ? "#7F77DD" : "var(--text-faint)";

function StandingsTable({ data }) {
  const top = data[0]?.pts ?? 1;
  return (
    <div>
      <div className={styles.tableHeader} aria-hidden="true">
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
    </div>
  );
}

export default function RugbyView() {
  useEffect(() => {
    if (!window.location.hash) return;
    const id = window.location.hash.slice(1);
    const tryScroll = (attempts = 0) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attempts < 10) {
        setTimeout(() => tryScroll(attempts + 1), 100);
      }
    };
    tryScroll();
  }, []);

  const [comp, setComp] = useState("sixnations");

  const active    = COMPS.find((c) => c.id === comp) || COMPS[0];
  const standings = active.data;
  const six = SIX_NATIONS_2026[0], urc = URC_STANDINGS_2026_27[0], prem = PREMIERSHIP_STANDINGS_2026_27[0];
  const kpis = [
    { label: "Six Nations 2026",    val: six.team,  sub: `Champions · ${six.pts} pts${six.l === 0 && six.d === 0 ? " · Grand Slam" : ""}` },
    { label: "URC Leaders",         val: urc.team,  sub: `${urc.pts} pts from ${urc.p}` },
    { label: "Premiership Leaders", val: prem.team, sub: `${prem.pts} pts from ${prem.p}` },
    { label: "World Champions",     val: "S. Africa", sub: "Rugby World Cup 2023" },
  ];

  return (
    <div>
      <SportsRecents sport="rugby" />
      <div className={styles.kpiRow}>
        {kpis.map((k) => (
          <div key={k.label} className={styles.kpi}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={styles.kpiVal}>{k.val}</p>
            <p className={styles.kpiSub}>{k.sub}</p>
          </div>
        ))}
      </div>
      <UpdatedNote date={RUGBY_UPDATED} source={RUGBY_SOURCE} />

      <div className={styles.grid}>
        <div className={styles.panel} id="standings">
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
          <p className={styles.seasonNote}>{active.label} {active.season}</p>
          <StandingsTable data={standings} />
        </div>

        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Recent Results</h3>
          {RECENT_RUGBY.map((r) => (
            <div key={`${r.home}-${r.away}-${r.date}`} className={styles.resultRow}>
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
                <span className={styles.date}>{fmtDate(r.date)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
