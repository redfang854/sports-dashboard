import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { FIGHTER_IMAGES, F1_DRIVER_IMAGES, F1_TEAM_LOGOS } from "../data/images";
import styles from "./Modal.module.css";

function useEscapeKey(onClose) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
}

export function FighterModal({ fighter, onClose }) {
  useEscapeKey(onClose);
  if (!fighter) return null;

  const { name, nationality, division, record, age, reach, finishRate, lastResult, bio, id } = fighter;
  const imgSrc = FIGHTER_IMAGES[id] || FIGHTER_IMAGES[fighter.fighterId];

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        <div className={styles.header}>
          <Avatar src={imgSrc} name={name} color="#E24B4A" size={64} shape="circle" />
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
          <div className={styles.stat}><span className={styles.statVal} style={{ fontSize: 12 }}>{lastResult}</span><span className={styles.statLabel}>Last Result</span></div>
        </div>

        <p className={styles.bio}>{bio}</p>
      </div>
    </div>
  );
}

export function DriverModal({ driver, onClose }) {
  useEscapeKey(onClose);
  const [careerStats, setCareerStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!driver) return;
    setLoadingStats(true);
    fetch(`/api/f1-driver?name=${encodeURIComponent(driver.name)}`)
      .then((r) => r.json())
      .then((data) => setCareerStats(data.found ? data : null))
      .catch(() => setCareerStats(null))
      .finally(() => setLoadingStats(false));
  }, [driver?.name]);

  if (!driver) return null;

  const { name, team, nationality, age, pts, wins, podiums, color, bio, id, driverId } = driver;
  const key     = id || driverId;
  const imgSrc  = F1_DRIVER_IMAGES[key];
  const teamLogo = F1_TEAM_LOGOS[team];

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        {/* Team colour accent bar */}
        <div className={styles.accentBar} style={{ background: color || "#333" }} />

        <div className={styles.header}>
          <Avatar src={imgSrc} name={name} color={color || "#888"} size={64} shape="circle" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className={styles.name}>{name}</h2>
            <p className={styles.sub}>{nationality}</p>
            <div className={styles.teamRow}>
              {teamLogo && (
                <img
                  src={teamLogo}
                  alt={team}
                  className={styles.teamLogo}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              )}
              <span className={styles.teamName}>{team}</span>
            </div>
          </div>
        </div>

        {/* Current season stats */}
        <p className={styles.sectionLabel}>2025 Season</p>
        <div className={styles.recordRow}>
          <div className={styles.recBox} style={{ background: "#63992215", borderColor: "#63992240" }}>
            <span className={styles.recNum} style={{ color: "#639922" }}>{wins}</span>
            <span className={styles.recLabel}>Wins</span>
          </div>
          <div className={styles.recBox} style={{ background: "#37AADD15", borderColor: "#37AADD40" }}>
            <span className={styles.recNum} style={{ color: "#378ADD" }}>{podiums ?? "—"}</span>
            <span className={styles.recLabel}>Podiums</span>
          </div>
          <div className={styles.recBox} style={{ background: (color || "#888") + "15", borderColor: (color || "#888") + "40" }}>
            <span className={styles.recNum} style={{ color: color || "#888" }}>{pts}</span>
            <span className={styles.recLabel}>Points</span>
          </div>
        </div>

        {/* Career stats from DB */}
        {loadingStats && (
          <p className={styles.careerLoading}>Loading career stats...</p>
        )}

        {careerStats && (
          <>
            <p className={styles.sectionLabel}>
              Career ({careerStats.debutSeason}–{careerStats.lastSeason})
            </p>
            <div className={styles.recordRow}>
              <div className={styles.recBox} style={{ background: "#BA751715", borderColor: "#BA751740" }}>
                <span className={styles.recNum} style={{ color: "#BA7517" }}>{careerStats.championships}</span>
                <span className={styles.recLabel}>🏆 Titles</span>
              </div>
              <div className={styles.recBox} style={{ background: "#63992215", borderColor: "#63992240" }}>
                <span className={styles.recNum} style={{ color: "#639922" }}>{careerStats.wins}</span>
                <span className={styles.recLabel}>Career Wins</span>
              </div>
              <div className={styles.recBox} style={{ background: "#37AADD15", borderColor: "#37AADD40" }}>
                <span className={styles.recNum} style={{ color: "#378ADD" }}>{careerStats.podiums}</span>
                <span className={styles.recLabel}>Podiums</span>
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.stat}>
                <span className={styles.statVal}>{careerStats.totalPoints.toLocaleString()}</span>
                <span className={styles.statLabel}>Career Points</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statVal}>{careerStats.totalRaces}</span>
                <span className={styles.statLabel}>Races Started</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statVal}>{careerStats.seasons}</span>
                <span className={styles.statLabel}>Seasons</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statVal}>{age ?? "—"}</span>
                <span className={styles.statLabel}>Age</span>
              </div>
            </div>

            {/* Extraordinary performances */}
            {careerStats.greatRaces?.length > 0 && (
              <>
                <p className={styles.sectionLabel}>Recent Race Wins</p>
                <div className={styles.greatRacesList}>
                  {careerStats.greatRaces.map((r, i) => (
                    <div key={i} className={styles.greatRaceRow}>
                      <span className={styles.greatRaceSeason}>{r.season}</span>
                      <span className={styles.greatRaceName}>{r.name}</span>
                      <span className={styles.greatRaceCountry}>{r.country}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <p className={styles.bio}>{bio}</p>
      </div>
    </div>
  );
}
