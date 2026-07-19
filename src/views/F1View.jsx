import { useState, useRef } from "react";
import { useFetch } from "../hooks/useFetch";
import { fetchF1DriverStandings, fetchF1ConstructorStandings, fetchF1RecentRaces, fetchF1Schedule, fetchF1LatestRaceResults } from "../api";
import Countdown from "../components/Countdown";
import { DriverModal } from "../components/Modal";
import { LoadingState, ErrorState, LiveBadge } from "../components/StatusStates";
import Avatar from "../components/Avatar";
import { F1_DRIVER_IMAGES, F1_TEAM_LOGOS } from "../data/images";
import { F1_DRIVERS } from "../data";
import styles from "./F1View.module.css";
import Hero from "../components/Hero";
import SeasonRecap from "../components/SeasonRecap";

const TEAM_COLORS = {
  Mercedes: "#00D2BE", McLaren: "#FF8700", Ferrari: "#DC0000",
  "Red Bull": "#1E41FF", Alpine: "#0093CC", "Aston Martin": "#006F62",
  Williams: "#005AFF", Haas: "#E8002D", RB: "#6692FF", Audi: "#bb0f28",
};

const posColor = (p) => p === 1 ? "#BA7517" : p === 2 ? "#999" : p === 3 ? "#7F77DD" : "#444";

// Map API driver name → our local ID key for images
function resolveDriverKey(apiName) {
  const last = apiName.split(" ").pop().toLowerCase();
  const map = {
    antonelli: "antonelli", russell: "russell", norris: "norris",
    piastri: "piastri", leclerc: "leclerc", hamilton: "hamilton",
    verstappen: "verstappen", sainz: "sainz", alonso: "alonso",
    stroll: "stroll", gasly: "gasly", ocon: "ocon",
    bearman: "bearman", hulkenberg: "hulkenberg", tsunoda: "tsunoda",
    lawson: "lawson", albon: "albon", colapinto: "colapinto",
    bottas: "bottas", zhou: "zhou", sargeant: "sargeant",
    magnussen: "magnussen", doohan: "doohan", bortoleto: "bortoleto",
    hadjar: "hadjar", lindblad: "lindblad", aron: "aron", vries: "devries",
  };
  return Object.keys(map).find((k) => last.includes(k)) || null;
}

// Format a driver's latest-race finish for display
function formatResult(r) {
  if (r.status === "Finished") return r.time || `+${r.laps} laps`;
  if (r.status?.includes("Lap")) return r.status; // e.g. "+1 Lap"
  return r.status || "DNF";
}

export default function F1View() {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const latestRef = useRef(null);

  const drivers      = useFetch(fetchF1DriverStandings);
  const constructors = useFetch(fetchF1ConstructorStandings);
  const races        = useFetch(fetchF1RecentRaces);
  const schedule     = useFetch(fetchF1Schedule);
  const latestRace   = useFetch(fetchF1LatestRaceResults);

  const nextRace  = schedule.data?.[0];
  const topPts    = drivers.data?.[0]?.points ?? 1;
  const topCPts   = constructors.data?.[0]?.points ?? 1;

  const enrichDriver = (apiDriver) => {
    const key   = resolveDriverKey(apiDriver.name);
    const local = F1_DRIVERS.find((d) => d.id === key);
    return {
      ...apiDriver,
      id:      key,
      pts:     apiDriver.points,
      pts:     apiDriver.points,
      wins:    apiDriver.wins ?? 0,
      color:   TEAM_COLORS[apiDriver.team] || "#888",
      podiums: local?.podiums ?? "—",
      age:     local?.age ?? "—",
      bio:     local?.bio ?? `${apiDriver.name} — competing for ${apiDriver.team} in the current F1 season.`,
    };
  };

  return (
    <div>
      <Hero pageKey="f1" />
      <SeasonRecap pageKey="f1" />
      {schedule.loading
        ? <div className={styles.cdPlaceholder}>Loading race schedule...</div>
        : nextRace && (
          <Countdown
            eventName={nextRace.name}
            venueName={`${nextRace.circuit} · ${nextRace.date}`}
            target={nextRace.target}
          />
        )
      }

      {/* KPI strip */}
      <div className={styles.kpiRow}>
        <div className={styles.kpi}>
          <p className={styles.kpiLabel}>Championship Leader</p>
          <p className={styles.kpiVal}>{drivers.loading ? "—" : drivers.data?.[0]?.name.split(" ").pop()}</p>
          <p className={styles.kpiSub}>{drivers.loading ? "loading..." : `${drivers.data?.[0]?.team} · ${drivers.data?.[0]?.points} pts`}</p>
        </div>
        <div className={styles.kpi}>
          <p className={styles.kpiLabel}>Gap P1 → P2</p>
          <p className={styles.kpiVal}>{drivers.loading ? "—" : `${(drivers.data?.[0]?.points ?? 0) - (drivers.data?.[1]?.points ?? 0)} pts`}</p>
          <p className={styles.kpiSub}>{drivers.loading ? "—" : `${drivers.data?.[1]?.name.split(" ").pop()} · ${drivers.data?.[1]?.points} pts`}</p>
        </div>
        <div className={styles.kpi}>
          <p className={styles.kpiLabel}>Last Race Winner</p>
          <p className={styles.kpiVal}>{races.loading ? "—" : races.data?.[0]?.winner.split(" ").pop()}</p>
          <p className={styles.kpiSub}>{races.loading ? "loading..." : races.data?.[0]?.name}</p>
        </div>
        <div className={styles.kpi}>
          <p className={styles.kpiLabel}>Next Race</p>
          <p className={styles.kpiVal}>{schedule.loading ? "—" : nextRace?.name.replace(" Grand Prix", " GP")}</p>
          <p className={styles.kpiSub}>{schedule.loading ? "loading..." : nextRace?.date}</p>
        </div>
      </div>

      <button
        type="button"
        className={styles.jumpButton}
        onClick={() => latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      >
        Latest Race Results ↓
      </button>

      <div className={styles.grid}>

        {/* ── DRIVERS ── */}
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Drivers' Championship <LiveBadge /></h3>
          <p className={styles.eventLabel}>Current season · live standings</p>

          {drivers.loading && <LoadingState message="Fetching driver standings..." />}
          {drivers.error   && <ErrorState message={drivers.error} onRetry={drivers.refetch} />}

          {drivers.data?.map((raw) => {
            const driver = enrichDriver(raw);
            const imgSrc = F1_DRIVER_IMAGES[driver.id];
            return (
              <button key={driver.driverId} className={styles.driverRow} onClick={() => setSelectedDriver(driver)}>
                <span className={styles.pos} style={{ color: posColor(driver.pos) }}>{driver.pos}</span>
                <Avatar src={imgSrc} name={driver.name} color={driver.color} size={36} shape="circle" />
                <div className={styles.driverInfo}>
                  <p className={styles.driverName}>{driver.name}</p>
                  <p className={styles.driverTeam}>{driver.team}</p>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${Math.round((driver.points / topPts) * 100)}%`, background: driver.color }} />
                  </div>
                </div>
                <div className={styles.ptsBox}>
                  <span className={styles.pts}>{driver.points}</span>
                  <span className={styles.ptsLabel}>PTS</span>
                </div>
              </button>
            );
          })}
        </div>

        <div>
          {/* ── CONSTRUCTORS ── */}
          <div className={styles.panel} style={{ marginBottom: 16 }}>
            <h3 className={styles.panelTitle}>Constructors' <LiveBadge /></h3>
            <p className={styles.eventLabel}>Current season · live standings</p>

            {constructors.loading && <LoadingState message="Fetching constructors..." />}
            {constructors.error   && <ErrorState message={constructors.error} onRetry={constructors.refetch} />}

            {constructors.data?.map((team) => {
              const color   = TEAM_COLORS[team.name] || "#888";
              const logoSrc = F1_TEAM_LOGOS[team.name];
              return (
                <div key={team.constructorId} className={styles.constructorRow}>
                  <span className={styles.pos} style={{ color: posColor(team.pos) }}>{team.pos}</span>
                  <div className={styles.teamLogoWrap}>
                    {logoSrc
                      ? <img src={logoSrc} alt={team.name} className={styles.teamLogoImg} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      : <div className={styles.teamDot} style={{ background: color }} />
                    }
                  </div>
                  <div className={styles.driverInfo}>
                    <p className={styles.driverName}>{team.name}</p>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${Math.round((team.points / topCPts) * 100)}%`, background: color }} />
                    </div>
                  </div>
                  <div className={styles.ptsBox}>
                    <span className={styles.pts}>{team.points}</span>
                    <span className={styles.ptsLabel}>PTS</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── RECENT RACES ── */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Race Results <LiveBadge /></h3>

            {races.loading && <LoadingState message="Fetching results..." />}
            {races.error   && <ErrorState message={races.error} onRetry={races.refetch} />}

            {races.data?.map((race) => (
              <div key={race.round} className={styles.raceRow}>
                <div className={styles.raceNum}>R{race.round}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className={styles.raceName}>{race.name}</p>
                  <p className={styles.raceCircuit}>{race.circuit}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p className={styles.raceWinner}>{race.winner.split(" ").pop()}</p>
                  <p className={styles.raceTeam}>{race.team}</p>
                </div>
              </div>
            ))}

            {schedule.data?.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #ffffff08" }}>
                <p className={styles.eventLabel} style={{ marginBottom: 10 }}>Upcoming</p>
                {schedule.data.slice(0, 3).map((race) => (
                  <div key={race.round} className={styles.raceRow}>
                    <div className={styles.raceNum}>R{race.round}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className={styles.raceName}>{race.name}</p>
                      <p className={styles.raceCircuit}>{race.circuit}</p>
                    </div>
                    <span className={styles.raceDate}>{race.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── LATEST RACE RESULTS (full grid, every driver) ── */}
      <div className={styles.panel} style={{ marginTop: 16 }} ref={latestRef}>
        <h3 className={styles.panelTitle}>
          Latest Race Results <LiveBadge />
        </h3>
        <p className={styles.eventLabel}>
          {latestRace.loading
            ? "Loading..."
            : latestRace.data
              ? `${latestRace.data.name} · ${latestRace.data.circuit} · ${latestRace.data.date}`
              : "No completed race yet this season"}
        </p>

        {latestRace.loading && <LoadingState message="Fetching latest race results..." />}
        {latestRace.error   && <ErrorState message={latestRace.error} onRetry={latestRace.refetch} />}

        {latestRace.data?.results.map((r) => {
          const color = TEAM_COLORS[r.team] || "#888";
          return (
            <div key={r.driverId} className={styles.resultRow}>
              <span className={styles.pos} style={{ color: posColor(r.pos) }}>{r.pos}</span>
              <div className={styles.teamDot} style={{ background: color, marginRight: 2 }} />
              <div className={styles.driverInfo}>
                <p className={styles.driverName}>{r.name}</p>
                <p className={styles.driverTeam}>{r.team}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p className={styles.raceWinner}>{formatResult(r)}</p>
                <p className={styles.raceTeam}>{r.points} pts</p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedDriver && (
        <DriverModal driver={selectedDriver} onClose={() => setSelectedDriver(null)} />
      )}
    </div>
  );
}
