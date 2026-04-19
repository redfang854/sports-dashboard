import { WRC_DRIVER_STANDINGS_2026, WRC_MANUFACTURER_STANDINGS_2026, WRC_CALENDAR_2026 } from "../data/wrc";
import styles from "./WrcView.module.css";

const posColor = (p) => p === 1 ? "#BA7517" : p === 2 ? "#999" : p === 3 ? "#7F77DD" : "#444";

export default function WrcView() {
  const leader  = WRC_DRIVER_STANDINGS_2026[0];
  const topPts  = leader.pts;
  const topMPts = WRC_MANUFACTURER_STANDINGS_2026[0].pts;
  const nextRace = WRC_CALENDAR_2026.find((r) => r.status === "next");
  const done     = WRC_CALENDAR_2026.filter((r) => r.status === "done").length;

  return (
    <div>
      <div className={styles.kpiRow}>
        {[
          { label: "Championship Leader", val: leader.name.split(" ").pop(), sub: `${leader.team} · ${leader.pts} pts` },
          { label: "Rounds Complete",     val: `${done}/${WRC_CALENDAR_2026.length}`, sub: "2026 WRC season" },
          { label: "Next Rally",          val: nextRace?.name.replace("Rally ", "") ?? "—", sub: `${nextRace?.country} · ${nextRace?.date}` },
          { label: "Top Manufacturer",    val: "Toyota", sub: `${WRC_MANUFACTURER_STANDINGS_2026[0].pts} pts` },
        ].map((k) => (
          <div key={k.label} className={styles.kpi}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={styles.kpiVal}>{k.val}</p>
            <p className={styles.kpiSub}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        <div>
          <div className={styles.panel} style={{ marginBottom: 16 }}>
            <h3 className={styles.panelTitle}>Driver Standings</h3>
            <p className={styles.eventLabel}>2026 WRC season · after Round {done}</p>
            {WRC_DRIVER_STANDINGS_2026.map((d) => (
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
            {WRC_MANUFACTURER_STANDINGS_2026.map((m) => (
              <div key={m.name} className={styles.driverRow}>
                <span className={styles.pos} style={{ color: posColor(m.pos) }}>{m.pos}</span>
                <div className={styles.driverInfo}>
                  <p className={styles.driverName}>{m.name}</p>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${Math.round((m.pts / topMPts) * 100)}%`, background: m.color }} />
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
          <h3 className={styles.panelTitle}>2026 Calendar</h3>
          <div className={styles.calendar}>
            {WRC_CALENDAR_2026.map((r) => (
              <div key={r.round} className={`${styles.calRow} ${r.status === "next" ? styles.calNext : r.status === "done" ? styles.calDone : ""}`}>
                <div className={styles.calRound}>R{r.round}</div>
                <div className={styles.calInfo}>
                  <p className={styles.calName}>{r.name}</p>
                  <p className={styles.calCountry}>{r.country} · {r.date}</p>
                </div>
                <div className={styles.calRight}>
                  {r.status === "done" && r.winner && <span className={styles.calWinner}>{r.winner}</span>}
                  {r.status === "next" && <span className={styles.calNextBadge}>NEXT</span>}
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
