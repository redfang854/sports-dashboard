import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { fetchTeams, fetchSquad, fetchH2H, fetchH2HBetween, COMPETITIONS } from "../api/teams";
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

function H2HSection({ teams }) {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [triggered, setTriggered] = useState(false);

  const selectedA = teams.find((t) => String(t.id) === teamA);
  const selectedB = teams.find((t) => String(t.id) === teamB);

  const { data, loading, error } = useFetch(
    () => triggered && selectedA && selectedB
      ? fetchH2HBetween(selectedA.id, selectedB.id)
      : Promise.resolve(null),
    [triggered, teamA, teamB]
  );

  const matches = data || [];
  const winsA = matches.filter((m) =>
    (m.winner === "HOME_TEAM" && m.homeTeam === selectedA?.name) ||
    (m.winner === "AWAY_TEAM" && m.awayTeam === selectedA?.name)
  ).length;
  const winsB = matches.filter((m) =>
    (m.winner === "HOME_TEAM" && m.homeTeam === selectedB?.name) ||
    (m.winner === "AWAY_TEAM" && m.awayTeam === selectedB?.name)
  ).length;
  const draws = matches.filter((m) => m.winner === "DRAW").length;
  const total = (winsA + winsB + draws) || 1;

  function handleCompare() {
    if (teamA && teamB && teamA !== teamB) setTriggered(true);
  }

  function handleReset() {
    setTeamA("");
    setTeamB("");
    setTriggered(false);
  }

  return (
    <div className={styles.h2hSection}>
      <h3 className={styles.h2hTitle}>⚔️ Head to Head</h3>
      <p className={styles.h2hSub}>Select two teams to see their full match history</p>

      <div className={styles.h2hSelectors}>
        <select
          className={styles.h2hSelect}
          value={teamA}
          onChange={(e) => { setTeamA(e.target.value); setTriggered(false); }}
        >
          <option value="">Select Team A</option>
          {teams.map((t) => (
            <option key={t.id} value={String(t.id)} disabled={String(t.id) === teamB}>
              {t.name}
            </option>
          ))}
        </select>

        <span className={styles.h2hVs}>VS</span>

        <select
          className={styles.h2hSelect}
          value={teamB}
          onChange={(e) => { setTeamB(e.target.value); setTriggered(false); }}
        >
          <option value="">Select Team B</option>
          {teams.map((t) => (
            <option key={t.id} value={String(t.id)} disabled={String(t.id) === teamA}>
              {t.name}
            </option>
          ))}
        </select>

        <button
          className={styles.h2hBtn}
          onClick={handleCompare}
          disabled={!teamA || !teamB || teamA === teamB}
        >
          Compare
        </button>
      </div>

      {loading && <LoadingState message="Loading head-to-head history..." />}
      {error   && <ErrorState message={error} />}

      {triggered && !loading && data !== null && (
        <>
          {matches.length === 0 ? (
            <p className={styles.h2hEmpty}>No matches found between these two teams in our records.</p>
          ) : (
            <>
              <div className={styles.h2hBanner}>
                <div className={styles.h2hTeam}>
                  <img src={selectedA?.crest} alt={selectedA?.name} className={styles.h2hCrest}
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <span className={styles.h2hTeamName}>{selectedA?.name}</span>
                </div>
                <div className={styles.h2hScoreBig}>
                  <span style={{ color: "#639922" }}>{winsA}</span>
                  <span style={{ color: "#444", margin: "0 4px" }}>—</span>
                  <span style={{ color: "#666" }}>{draws}</span>
                  <span style={{ color: "#444", margin: "0 4px" }}>—</span>
                  <span style={{ color: "#E24B4A" }}>{winsB}</span>
                </div>
                <div className={styles.h2hTeam} style={{ alignItems: "flex-end" }}>
                  <img src={selectedB?.crest} alt={selectedB?.name} className={styles.h2hCrest}
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <span className={styles.h2hTeamName}>{selectedB?.name}</span>
                </div>
              </div>

              <div className={styles.h2hRecordLabels}>
                <span style={{ color: "#639922" }}>{winsA} wins</span>
                <span style={{ color: "#666" }}>{draws} draws</span>
                <span style={{ color: "#E24B4A" }}>{winsB} wins</span>
              </div>

              <div className={styles.predBar} style={{ marginBottom: 20 }}>
                <div style={{ width: `${Math.round(winsA/total*100)}%`, background: "#639922", height: "100%", borderRadius: "100px 0 0 100px" }} />
                <div style={{ width: `${Math.round(draws/total*100)}%`, background: "#555", height: "100%" }} />
                <div style={{ width: `${Math.round(winsB/total*100)}%`, background: "#E24B4A", height: "100%", borderRadius: "0 100px 100px 0" }} />
              </div>

              <p className={styles.sectionLabel}>{matches.length} matches played</p>
              {matches.map((m, i) => {
                const aIsHome = m.homeTeam === selectedA?.name;
                const aScore  = aIsHome ? m.homeScore : m.awayScore;
                const bScore  = aIsHome ? m.awayScore : m.homeScore;
                const winner  = m.winner === "DRAW" ? "D"
                  : ((m.winner === "HOME_TEAM") === aIsHome) ? "A" : "B";
                return (
                  <div key={m.id || i} className={styles.matchRow}>
                    <span className={styles.matchDate}>{m.date}</span>
                    <span className={styles.matchOpp} style={{ color: winner === "A" ? "#639922" : "#aaa" }}>
                      {selectedA?.short || selectedA?.name}
                    </span>
                    <span className={styles.matchScore}>{aScore}–{bScore}</span>
                    <span className={styles.matchOpp} style={{ color: winner === "B" ? "#E24B4A" : "#aaa", textAlign: "right" }}>
                      {selectedB?.short || selectedB?.name}
                    </span>
                    <span className={styles.matchComp}>{m.competition}</span>
                  </div>
                );
              })}

              <button className={styles.h2hResetBtn} onClick={handleReset}>Clear</button>
            </>
          )}
        </>
      )}
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

      {data && data.length > 0 && (
        <H2HSection teams={data} />
      )}
    </div>
  );
}
