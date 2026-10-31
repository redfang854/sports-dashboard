import { useEffect } from "react";
import {
  WRC_DRIVER_STANDINGS, WRC_MANUFACTURER_STANDINGS, WRC_CALENDAR,
  WRC_UPDATED, WRC_SOURCE, WRC_SEASON, wrcRoundStatus, wrcDateRange,
} from "../data/wrc";
import UpdatedNote from "../components/UpdatedNote";
import styles from "./WrcView.module.css";
import SportsRecents from "../components/SportsRecents";

const posColor = (p) => p === 1 ? "#BA7517" : p === 2 ? "#999" : p === 3 ? "#7F77DD" : "var(--text-faint)";

export default function WrcView() {
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

  const leader   = WRC_DRIVER_STANDINGS[0];
  const topPts   = leader.pts;
  const topMan   = WRC_MANUFACTURER_STANDINGS[0];
  const rounds   = WRC_CALENDAR.map((r) => ({ ...r, status: wrcRoundStatus(r) }));
  const done     = rounds.filter((r) => r.status === "done").length;
  const current  = rounds.find((r) => r.status === "live") || rounds.find((r) => r.status === "next");
  const complete = done === rounds.length;

  const kpis = complete
    ? [
        { label: `${WRC_SEASON} Champion`,          val: leader.name.split(" ").pop(), sub: `${leader.team} · ${leader.pts} pts` },
        { label: "Title Margin",           val: `${leader.pts - WRC_DRIVER_STANDINGS[1].pts} pts`, sub: `over ${WRC_DRIVER_STANDINGS[1].name}` },
        { label: "Season",                 val: "Complete", sub: `${done} of ${rounds.length} rounds run` },
        { label: "Manufacturers' Champion", val: topMan.short, sub: `${topMan.pts} pts` },
      ]
    : [
        { label: "Championship Leader", val: leader.name.split(" ").pop(), sub: `${leader.team} · ${leader.pts} pts` },
        { label: "Rounds Complete",     val: `${done}/${rounds.length}`, sub: `${WRC_SEASON} WRC season` },
        { label: current?.status === "live" ? "Rally Now" : "Next Rally",
          val: current ? current.name.replace(/^Rally(e)? /, "") : "—",
          sub: current ? `${current.country} · ${wrcDateRange(current)}` : "" },
        { label: "Top Manufacturer",    val: topMan.short, sub: `${topMan.pts} pts` },
      ];

  return (
    <div>
      <SportsRecents sport="wrc" />
      <div className={styles.kpiRow}>
        {kpis.map((k) => (
          <div key={k.label} className={styles.kpi}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={styles.kpiVal}>{k.val}</p>
            <p className={styles.kpiSub}>{k.sub}</p>
          </div>
        ))}
      </div>
      <UpdatedNote date={WRC_UPDATED} source={WRC_SOURCE} />

      <div className={styles.grid}>
        <div>
          <div className={styles.panel} style={{ marginBottom: 16 }} id="standings">
            <h3 className={styles.panelTitle}>Driver Standings</h3>
            <p className={styles.eventLabel}>{WRC_SEASON} WRC season · {complete ? "final standings" : `after Round ${done}`}</p>
            {WRC_DRIVER_STANDINGS.map((d) => (
              <div key={d.name} className={styles.driverRow}>
                <span className={styles.pos} style={{ color: posColor(d.pos) }}>{d.pos}</span>
                <div className={styles.driverInfo}>
                  <p className={styles.driverName}>{d.name}</p>
                  <p className={styles.driverTeam}>{d.nationality} · {d.car}</p>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${Math.round((d.pts / topPts) * 100)}%`, background: d.color }} />
                  </div>
                </div>
                <div className={styles.ptsBox}>
                  <span className={styles.pts}>{d.pts}</span>
                  <span className={styles.ptsLabel}>PTS</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Manufacturers</h3>
            {WRC_MANUFACTURER_STANDINGS.map((m) => (
              <div key={m.name} className={styles.driverRow}>
                <span className={styles.pos} style={{ color: posColor(m.pos) }}>{m.pos}</span>
                <div className={styles.driverInfo}>
                  <p className={styles.driverName}>{m.name}</p>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${Math.round((m.pts / topMan.pts) * 100)}%`, background: m.color }} />
                  </div>
                </div>
                <div className={styles.ptsBox}>
                  <span className={styles.pts}>{m.pts}</span>
                  <span className={styles.ptsLabel}>PTS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>{WRC_SEASON} Calendar</h3>
          <div className={styles.calendar}>
            {rounds.map((r) => (
              <div key={r.round} className={`${styles.calRow} ${r.status === "next" || r.status === "live" ? styles.calNext : r.status === "done" ? styles.calDone : ""}`}>
                <div className={styles.calRound}>R{r.round}</div>
                <div className={styles.calInfo}>
                  <p className={styles.calName}>{r.name}</p>
                  <p className={styles.calCountry}>{r.country} · {wrcDateRange(r)}</p>
                </div>
                <div className={styles.calRight}>
                  {r.status === "done" && r.winner && <span className={styles.calWinner}>{r.winner}</span>}
                  {r.status === "next" && <span className={styles.calNextBadge}>NEXT</span>}
                  {r.status === "live" && <span className={styles.calNextBadge}>LIVE</span>}
                  {r.status === "upcoming" && <span className={styles.calUpcoming}>Upcoming</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
