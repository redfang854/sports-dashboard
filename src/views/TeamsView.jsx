import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { fetchTeams, fetchSquad, fetchH2H, COMPETITIONS } from "../api/teams";
import { LoadingState, ErrorState, LiveBadge } from "../components/StatusStates";
import styles from "./TeamsView.module.css";

const LEAGUES = Object.entries(COMPETITIONS).map(([code, v]) => ({ code, ...v }));
const POSITIONS = ["All", "Goalkeeper", "Defence", "Midfield", "Offence"];

function age(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob)) / 31557600000);
}

function SquadModal({ team, onClose }) {
  const { data, loading, error } = useFetch(
    () => fetchSquad(team.id, team.name, team.leagueCode),
    [team.id]
  );
  const [pos, setPos] = useState("All");
  const filtered = (data?.squad || []).filter(
    (p) => pos === "All" || p.position === pos
  );

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: 580 }}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <div className={styles.modalHeader}>
          <img src={team.crest} alt={team.name} className={styles.modalCrest}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div>
            <h2 className={styles.modalTitle}>{team.name}</h2>
            <p className={styles.modalSub}>Est. {team.founded} · {team.venue}</p>
            <p className={styles.modalSub} style={{ color: "#444" }}>{team.colors}</p>
          </div>
        </div>
        {loading && <LoadingState message="Loading squad..." />}
        {error   && <ErrorState message={error} />}
        {data && (
          <>
            <div className={styles.posFilter}>
              {POSITIONS.map((p) => (
                <button key={p}
                  className={`${styles.posBtn} ${pos === p ? styles.posBtnActive : ""}`}
                  onClick={() => setPos(p)}>{p}</button>
              ))}
            </div>
            <div className={styles.squadGrid}>
              {filtered.map((player) => (
                <div key={player.id} className={styles.playerCard}>
                  <img
                    src={player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=922b21&color=fff&size=80&bold=true&rounded=true`}
                    alt={player.name}
                    className={styles.playerPhoto}
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=922b21&color=fff&size=80&bold=true&rounded=true`; }}
                  />
                  <p className={styles.playerName}>{player.name}</p>
                  <p className={styles.playerPos}>{player.position || "—"}</p>
                  <p className={styles.playerMeta}>
                    {player.nationality || ""}
                    {player.age ? ` · ${player.age} yrs` : player.dob ? ` · ${age(player.dob)} yrs` : ""}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FormModal({ team, onClose }) {
  const { data, loading, error } = useFetch(() => fetchH2H(team.id), [team.id]);
  const wins   = data?.filter((m) => (m.winner === "HOME_TEAM" && m.homeTeam === team.name) || (m.winner === "AWAY_TEAM" && m.awayTeam === team.name)).length || 0;
  const losses = data?.filter((m) => (m.winner === "HOME_TEAM" && m.homeTeam !== team.name) || (m.winner === "AWAY_TEAM" && m.awayTeam !== team.name)).length || 0;
  const draws  = data?.filter((m) => m.winner === "DRAW").length || 0;
  const total  = (wins + losses + draws) || 1;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <div className={styles.modalHeader}>
          <img src={team.crest} alt={team.name} className={styles.modalCrest}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div>
            <h2 className={styles.modalTitle}>{team.name}</h2>
            <p className={styles.modalSub}>Last 10 matches</p>
          </div>
        </div>
        {loading && <LoadingState message="Loading form..." />}
        {error   && <ErrorState message={error} />}
        {data && (
          <>
            <div className={styles.recordBar}>
              <div className={styles.recordItem} style={{ color: "#639922" }}>
                <span className={styles.recordNum}>{wins}</span>
                <span className={styles.recordLbl}>Won</span>
              </div>
              <div className={styles.recordItem} style={{ color: "#888" }}>
                <span className={styles.recordNum}>{draws}</span>
                <span className={styles.recordLbl}>Drawn</span>
              </div>
              <div className={styles.recordItem} style={{ color: "#E24B4A" }}>
                <span className={styles.recordNum}>{losses}</span>
                <span className={styles.recordLbl}>Lost</span>
              </div>
            </div>
            <div className={styles.predBar}>
              <div style={{ width: `${Math.round(wins/total*100)}%`, background: "#639922", height: "100%", borderRadius: "100px 0 0 100px" }} />
              <div style={{ width: `${Math.round(draws/total*100)}%`, background: "#555", height: "100%" }} />
              <div style={{ width: `${Math.round(losses/total*100)}%`, background: "#E24B4A", height: "100%", borderRadius: "0 100px 100px 0" }} />
            </div>
            <p className={styles.sectionLabel}>Recent results</p>
            {data.map((m, i) => {
              const isHome  = m.homeTeam === team.name;
              const myScore = isHome ? m.homeScore : m.awayScore;
              const opScore = isHome ? m.awayScore : m.homeScore;
              const opp     = isHome ? m.awayTeam  : m.homeTeam;
              const result  = m.winner === "DRAW" ? "D" : ((m.winner === "HOME_TEAM") === isHome) ? "W" : "L";
              const color   = result === "W" ? "#639922" : result === "D" ? "#888" : "#E24B4A";
              return (
                <div key={i} className={styles.matchRow}>
                  <span className={styles.matchDate}>{m.date}</span>
                  <span className={styles.matchResult} style={{ color }}>{result}</span>
                  <span className={styles.matchScore}>{myScore}–{opScore}</span>
                  <span className={styles.matchOpp}>{opp}</span>
                  <span className={styles.matchComp}>{m.competition}</span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function TeamCard({ team }) {
  const [showSquad, setShowSquad] = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  return (
    <>
      <div className={styles.teamCard}>
        <div className={styles.teamCardHeader}>
          <img src={team.crest} alt={team.name} className={styles.teamCrest}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className={styles.teamCardInfo}>
            <h3 className={styles.teamName}>{team.name}</h3>
            <p className={styles.teamMeta}>
              {team.founded ? `Est. ${team.founded}` : ""}
              {team.venue ? ` · ${team.venue}` : ""}
            </p>
            <p className={styles.teamColors}>{team.colors}</p>
          </div>
          <div className={styles.teamActions}>
            <button className={styles.actionBtn} onClick={() => setShowSquad(true)}>Squad</button>
            <button className={styles.actionBtn} onClick={() => setShowForm(true)}>Form</button>
          </div>
        </div>
      </div>
      {showSquad && <SquadModal team={team} onClose={() => setShowSquad(false)} />}
      {showForm  && <FormModal  team={team} onClose={() => setShowForm(false)}  />}
    </>
  );
}

export default function TeamsView() {
  const [league, setLeague] = useState("PL");
  const [search, setSearch] = useState("");
  const { data, loading, error } = useFetch(() => fetchTeams(league), [league]);
  const filtered = (data || []).filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className={styles.viewHeader}>
        <div>
          <h2 className={styles.viewTitle}>Teams &amp; Squads</h2>
          <p className={styles.viewSub}>Full rosters, form guide, match history · <LiveBadge /></p>
        </div>
        <input className={styles.searchBox} placeholder="Search team..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className={styles.leagueTabs}>
        {LEAGUES.map((l) => (
          <button key={l.code}
            className={`${styles.leagueTab} ${league === l.code ? styles.leagueTabActive : ""}`}
            onClick={() => { setLeague(l.code); setSearch(""); }}>
            {l.flag} {l.name}
          </button>
        ))}
      </div>
      {loading && <LoadingState message="Loading teams..." />}
      {error   && <ErrorState message={error} />}
      <div className={styles.teamsList}>
        {filtered.map((team) => <TeamCard key={team.id} team={team} />)}
      </div>
    </div>
  );
}
