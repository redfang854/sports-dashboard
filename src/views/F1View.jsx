import { useState } from "react";
import { F1_DRIVERS, F1_CONSTRUCTORS, UPCOMING_RACES } from "../data";
import Countdown from "../components/Countdown";
import { DriverModal } from "../components/Modal";
import styles from "./F1View.module.css";

const posColor = (pos) =>
  pos === 1 ? "#BA7517" : pos === 2 ? "#999" : pos === 3 ? "#7F77DD" : "#444";

export default function F1View() {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const nextRace = UPCOMING_RACES[0];
  const leader = F1_DRIVERS[0];

  return (
    <div>
      <Countdown
        eventName={nextRace.name}
        venueName={`${nextRace.circuit} · ${nextRace.date}`}
        target={nextRace.target}
      />

      <div className={styles.kpiRow}>
        {[
          { label: "Championship Leader", val: "Antonelli", sub: "Mercedes · 72 pts" },
          { label: "Gap to P2", val: "9 pts", sub: "Russell 63 pts" },
          { label: "Races Complete", val: "3 / 22", sub: "AUS · CHN · JPN" },
          { label: "Youngest Leader Ever", val: "19 yrs", sub: "Antonelli breaks record" },
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
            Drivers' Championship
            <span className={styles.hint}>click a driver for profile</span>
          </h3>
          <p className={styles.eventLabel}>2026 season · after Round 3 — Japanese GP</p>

          {F1_DRIVERS.map((driver) => (
            <button
              key={driver.id}
              className={styles.driverRow}
              onClick={() => setSelectedDriver(driver)}
            >
              <span className={styles.pos} style={{ color: posColor(driver.pos) }}>
                {driver.pos}
              </span>
              <div className={styles.driverInfo}>
                <p className={styles.driverName}>{driver.name}</p>
                <p className={styles.driverTeam}>{driver.team}</p>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${Math.round((driver.pts / leader.pts) * 100)}%`,
                      background: driver.color,
                    }}
                  />
                </div>
              </div>
              <div className={styles.ptsBox}>
                <span className={styles.pts}>{driver.pts}</span>
                <span className={styles.ptsLabel}>PTS</span>
              </div>
            </button>
          ))}
        </div>

        <div>
          <div className={styles.panel} style={{ marginBottom: 16 }}>
            <h3 className={styles.panelTitle}>Constructors'</h3>
            <p className={styles.eventLabel}>2026 season · after Round 3</p>

            {F1_CONSTRUCTORS.map((team) => (
              <div key={team.name} className={styles.constructorRow}>
                <span className={styles.pos} style={{ color: posColor(team.pos) }}>
                  {team.pos}
                </span>
                <div className={styles.driverInfo}>
                  <p className={styles.driverName}>{team.name}</p>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${Math.round((team.pts / F1_CONSTRUCTORS[0].pts) * 100)}%`,
                        background: team.color,
                      }}
                    />
                  </div>
                </div>
                <div className={styles.ptsBox}>
                  <span className={styles.pts}>{team.pts}</span>
                  <span className={styles.ptsLabel}>PTS</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Upcoming Races</h3>
            {UPCOMING_RACES.map((race, i) => (
              <div key={race.name} className={styles.raceRow}>
                <div className={styles.raceNum}>{i + 4}</div>
                <div>
                  <p className={styles.raceName}>{race.name}</p>
                  <p className={styles.raceCircuit}>{race.circuit}</p>
                </div>
                <span className={styles.raceDate}>{race.date.split(",")[0]}</span>
              </div>
            ))}

            <div className={styles.contextBox}>
              <p className={styles.contextTitle}>Season context</p>
              <p className={styles.contextText}>
                Antonelli at <strong>19 yrs</strong> is the youngest championship leader in F1 history.
                Bahrain &amp; Saudi Arabia GPs cancelled due to Middle East conflict.
                Red Bull on just <strong>16 pts</strong> — their worst start in a decade.
              </p>
            </div>
          </div>
        </div>
      </div>

      {selectedDriver && (
        <DriverModal driver={selectedDriver} onClose={() => setSelectedDriver(null)} />
      )}
    </div>
  );
}
