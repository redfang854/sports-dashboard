import { useState, useEffect } from "react";
import { useFetch } from "../hooks/useFetch";
import {
  FOOTBALL_COMPETITIONS, EPL_STANDINGS_STATIC, LA_LIGA_STATIC,
  SERIE_A_STATIC, BUNDESLIGA_STATIC, LIGUE_1_STATIC, UCL_LAST16,
} from "../data/football";
import { fetchTeams, fetchSquad, fetchH2H, fetchH2HBetween, fetchFixtures, COMPETITIONS } from "../api/teams";
import { WC_FIXTURES } from "../data/wcFixtures";
import { flagFor } from "../data/countryFlags";
import { LoadingState, ErrorState, LiveBadge } from "../components/StatusStates";
import WorldCupSemifinals from "./WorldCupSemifinals";
import styles from "./FootballView.module.css";
import teamStyles from "./TeamsView.module.css";
import SportsRecents from "../components/SportsRecents";

const WC_TAB = { id: "WC", name: "World Cup 2026", flag: "🌍", color: "#8B5CF6" };
const TOURNAMENTS = [...FOOTBALL_COMPETITIONS, WC_TAB];

// Leagues that support the Teams/Fixtures flow (have an entry in api/teams.js COMPETITIONS)
const TEAMS_CAPABLE = new Set(Object.keys(COMPETITIONS));

const STATIC_STANDINGS = {
  PL: EPL_STANDINGS_STATIC, PD: LA_LIGA_STATIC,
  SA: SERIE_A_STATIC, BL1: BUNDESLIGA_STATIC, FL1: LIGUE_1_STATIC,
};

// Leader cards and the standings table both need the same league table;
// share one request per competition for a few minutes.
const STANDINGS_TTL_MS = 5 * 60 * 1000;
const standingsCache = new Map();
function fetchStandings(compId) {
  const hit = standingsCache.get(compId);
  if (hit && Date.now() - hit.at < STANDINGS_TTL_MS) return hit.promise;
  const promise = loadStandings(compId).catch((err) => {
    standingsCache.delete(compId); // never cache failures
    throw err;
  });
  standingsCache.set(compId, { at: Date.now(), promise });
  return promise;
}

async function loadStandings(compId, retried = false) {
  const res = await fetch(`/api/standings?comp=${compId}`);
  if (res.status === 429) {
    // Upstream free tier is 10 req/min; one delayed retry usually succeeds.
    if (!retried) {
      await new Promise((r) => setTimeout(r, 7000));
      return loadStandings(compId, true);
    }
    throw new Error("Rate limited — try again in a moment");
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.standings[0].table.map((e) => ({
    pos:   e.position,
    team:  e.team.shortName || e.team.name,
    p:     e.playedGames,
    w:     e.won,
    d:     e.draw,
    l:     e.lost,
    pts:   e.points,
    gd:    e.goalDifference > 0 ? `+${e.goalDifference}` : String(e.goalDifference),
    crest: e.team.crest,
  }));
}

// Summary card for one league, built only from LIVE standings. On failure
// it says so instead of falling back to last season's static table.
function LeaderCard({ compId, label }) {
  const { data, loading, error } = useFetch(() => fetchStandings(compId), [compId]);
  const leader = data?.[0];
  return (
    <div className={styles.kpi}>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiVal}>{leader ? leader.team : "—"}</p>
      <p className={styles.kpiSub}>
        {leader ? `${leader.pts} pts · ${leader.w}W · ${leader.p} played`
          : loading ? "Loading live table…"
          : error ? "Live table unavailable" : "No data"}
      </p>
    </div>
  );
}

const LEADER_CARDS = [
  { compId: "PL",  label: "Premier League Leaders" },
  { compId: "PD",  label: "La Liga Leaders" },
  { compId: "SA",  label: "Serie A Leaders" },
  { compId: "BL1", label: "Bundesliga Leaders" },
];

const posColor = (p) =>
  p === 1 ? "#BA7517" : p === 2 ? "#999" : p === 3 ? "#7F77DD"
  : p <= 4 ? "#378ADD" : p >= 18 ? "#E24B4A" : "var(--text-faint)";

function age(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob)) / 31557600000);
}

function formatFixtureDate(iso) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

function StandingsPanel({ compId, compName }) {
  const { data, loading, error, refetch } = useFetch(() => fetchStandings(compId), [compId]);
  const rows   = data || STATIC_STANDINGS[compId] || [];
  const topPts = rows[0]?.pts ?? 1;

  return (
    <div>
      <div className={styles.panelMeta}>
        {data
          ? <LiveBadge />
          : !loading && <span className={styles.staticBadge}>Live table unavailable · showing 2025–26 final table</span>}
      </div>
      {loading && <LoadingState message={`Loading ${compName}...`} />}
      {error   && <ErrorState message={error} onRetry={refetch} />}
      {rows.length > 0 && (
        <div className={styles.colHeaders} aria-hidden="true">
          <span style={{ flex: 1 }} />
          {[["P", "Played"], ["W", "Won"], ["L", "Lost"], ["GD", "Goal difference"], ["Pts", "Points"]].map(([h, title]) => (
            <span key={h} className={styles.colHeader} title={title}>{h}</span>
          ))}
        </div>
      )}
      {rows.map((t) => (
        <div key={t.team} className={styles.teamRow}>
          <span className={styles.pos} style={{ color: posColor(t.pos) }}>{t.pos}</span>
          {t.crest
            ? <img src={t.crest} alt={t.team} className={styles.crest} onError={(e) => { e.currentTarget.style.display = "none"; }} />
            : <div className={styles.crestFallback} />}
          <div className={styles.teamInfo}>
            <p className={styles.teamName}>{t.team}</p>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${Math.round((t.pts / topPts) * 100)}%` }} />
            </div>
          </div>
          <div className={styles.statsCols}>
            <span className={styles.statNum}>{t.p}</span>
            <span className={styles.statNum}>{t.w}</span>
            <span className={styles.statNum}>{t.l}</span>
            <span className={styles.statGD}>{t.gd}</span>
            <span className={styles.statPts}>{t.pts}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FixturesPanel({ compId }) {
  const { data, loading, error, refetch } = useFetch(() => fetchFixtures(compId), [compId]);

  return (
    <div>
      <div className={styles.panelMeta}><LiveBadge /></div>
      {loading && <LoadingState message="Loading fixtures..." />}
      {error   && <ErrorState message={error} onRetry={refetch} />}
      {data && data.length === 0 && (
        <div>
          <p className={styles.eventLabel}>
            No upcoming scheduled fixtures found.
          </p>
        </div>
      )}
      {data && data.map((m) => {
        const { date, time } = formatFixtureDate(m.date);
        return (
          <div key={m.id} className={styles.matchRow}>
            <span className={styles.matchHome}>{m.homeTeam}</span>
            <div className={styles.matchScore}>
              <span className={styles.scoreDash} style={{ fontSize: 12 }}>{time}</span>
            </div>
            <span className={styles.matchAway}>{m.awayTeam}</span>
            <span className={styles.matchStage}>{date}</span>
          </div>
        );
      })}
    </div>
  );
}

function SquadModal({ team, onClose }) {
  const { data, loading, error } = useFetch(
    () => fetchSquad(team.id, team.name, team.leagueCode, team.short),
    [team.id]
  );
  const [pos, setPos] = useState("All");
  const POSITIONS = ["All", "Goalkeeper", "Defence", "Midfield", "Offence"];
  const filtered = (data?.squad || []).filter(
    (p) => pos === "All" || p.position === pos
  );

  return (
    <div className={teamStyles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={teamStyles.modal} style={{ maxWidth: 580 }}>
        <button className={teamStyles.closeBtn} onClick={onClose}>✕</button>
        <div className={teamStyles.modalHeader}>
          <img src={team.crest} alt={team.name} className={teamStyles.modalCrest}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div>
            <h2 className={teamStyles.modalTitle}>{team.name}</h2>
            <p className={teamStyles.modalSub}>Est. {team.founded} · {team.venue}</p>
            <p className={teamStyles.modalSub} style={{ color: "var(--text-faint)" }}>{team.colors}</p>
          </div>
        </div>
        {loading && <LoadingState message="Loading squad..." />}
        {error   && <ErrorState message={error} />}
        {data && (
          <>
            <div className={teamStyles.posFilter}>
              {POSITIONS.map((p) => (
                <button key={p}
                  className={`${teamStyles.posBtn} ${pos === p ? teamStyles.posBtnActive : ""}`}
                  onClick={() => setPos(p)}>{p}</button>
              ))}
            </div>
            <div className={teamStyles.squadGrid}>
              {filtered.map((player) => (
                <div key={player.id} className={teamStyles.playerCard}>
                  <img
                    src={player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=922b21&color=fff&size=80&bold=true&rounded=true`}
                    alt={player.name}
                    className={teamStyles.playerPhoto}
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=922b21&color=fff&size=80&bold=true&rounded=true`; }}
                  />
                  <p className={teamStyles.playerName}>{player.name}</p>
                  <p className={teamStyles.playerPos}>{player.position || "—"}</p>
                  <p className={teamStyles.playerMeta}>
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
    <div className={teamStyles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={teamStyles.modal}>
        <button className={teamStyles.closeBtn} onClick={onClose}>✕</button>
        <div className={teamStyles.modalHeader}>
          <img src={team.crest} alt={team.name} className={teamStyles.modalCrest}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div>
            <h2 className={teamStyles.modalTitle}>{team.name}</h2>
            <p className={teamStyles.modalSub}>Last 10 matches</p>
          </div>
        </div>
        {loading && <LoadingState message="Loading form..." />}
        {error   && <ErrorState message={error} />}
        {data && (
          <>
            <div className={teamStyles.recordBar}>
              <div className={teamStyles.recordItem} style={{ color: "#639922" }}>
                <span className={teamStyles.recordNum}>{wins}</span>
                <span className={teamStyles.recordLbl}>Won</span>
              </div>
              <div className={teamStyles.recordItem} style={{ color: "#888" }}>
                <span className={teamStyles.recordNum}>{draws}</span>
                <span className={teamStyles.recordLbl}>Drawn</span>
              </div>
              <div className={teamStyles.recordItem} style={{ color: "#E24B4A" }}>
                <span className={teamStyles.recordNum}>{losses}</span>
                <span className={teamStyles.recordLbl}>Lost</span>
              </div>
            </div>
            <div className={teamStyles.predBar}>
              <div style={{ width: `${Math.round(wins/total*100)}%`, background: "#639922", height: "100%", borderRadius: "100px 0 0 100px" }} />
              <div style={{ width: `${Math.round(draws/total*100)}%`, background: "#555", height: "100%" }} />
              <div style={{ width: `${Math.round(losses/total*100)}%`, background: "#E24B4A", height: "100%", borderRadius: "0 100px 100px 0" }} />
            </div>
            <p className={teamStyles.sectionLabel}>Recent results</p>
            {data.map((m, i) => {
              const isHome  = m.homeTeam === team.name;
              const myScore = isHome ? m.homeScore : m.awayScore;
              const opScore = isHome ? m.awayScore : m.homeScore;
              const opp     = isHome ? m.awayTeam  : m.homeTeam;
              const result  = m.winner === "DRAW" ? "D" : ((m.winner === "HOME_TEAM") === isHome) ? "W" : "L";
              const color   = result === "W" ? "#639922" : result === "D" ? "#888" : "#E24B4A";
              return (
                <div key={i} className={teamStyles.matchRow}>
                  <span className={teamStyles.matchDate}>{m.date}</span>
                  <span className={teamStyles.matchResult} style={{ color }}>{result}</span>
                  <span className={teamStyles.matchScore}>{myScore}–{opScore}</span>
                  <span className={teamStyles.matchOpp}>{opp}</span>
                  <span className={teamStyles.matchComp}>{m.competition}</span>
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
    setTeamA(""); setTeamB(""); setTriggered(false);
  }

  return (
    <div className={teamStyles.h2hSection}>
      <h3 className={teamStyles.h2hTitle}>⚔️ Head to Head</h3>
      <p className={teamStyles.h2hSub}>Select two teams to see their full match history</p>

      <div className={teamStyles.h2hSelectors}>
        <select className={teamStyles.h2hSelect} value={teamA}
          onChange={(e) => { setTeamA(e.target.value); setTriggered(false); }}>
          <option value="">Select Team A</option>
          {teams.map((t) => (
            <option key={t.id} value={String(t.id)} disabled={String(t.id) === teamB}>{t.name}</option>
          ))}
        </select>
        <span className={teamStyles.h2hVs}>VS</span>
        <select className={teamStyles.h2hSelect} value={teamB}
          onChange={(e) => { setTeamB(e.target.value); setTriggered(false); }}>
          <option value="">Select Team B</option>
          {teams.map((t) => (
            <option key={t.id} value={String(t.id)} disabled={String(t.id) === teamA}>{t.name}</option>
          ))}
        </select>
        <button className={teamStyles.h2hBtn} onClick={handleCompare}
          disabled={!teamA || !teamB || teamA === teamB}>Compare</button>
      </div>

      {loading && <LoadingState message="Loading head-to-head history..." />}
      {error   && <ErrorState message={error} />}

      {triggered && !loading && data !== null && (
        <>
          {matches.length === 0 ? (
            <p className={teamStyles.h2hEmpty}>No matches found between these two teams in our records.</p>
          ) : (
            <>
              <div className={teamStyles.h2hBanner}>
                <div className={teamStyles.h2hTeam}>
                  <img src={selectedA?.crest} alt={selectedA?.name} className={teamStyles.h2hCrest}
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <span className={teamStyles.h2hTeamName}>{selectedA?.name}</span>
                </div>
                <div className={teamStyles.h2hScoreBig}>
                  <span style={{ color: "#639922" }}>{winsA}</span>
                  <span style={{ color: "var(--text-faint)", margin: "0 4px" }}>—</span>
                  <span style={{ color: "var(--text-faint)" }}>{draws}</span>
                  <span style={{ color: "var(--text-faint)", margin: "0 4px" }}>—</span>
                  <span style={{ color: "#E24B4A" }}>{winsB}</span>
                </div>
                <div className={teamStyles.h2hTeam} style={{ alignItems: "flex-end" }}>
                  <img src={selectedB?.crest} alt={selectedB?.name} className={teamStyles.h2hCrest}
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <span className={teamStyles.h2hTeamName}>{selectedB?.name}</span>
                </div>
              </div>
              <div className={teamStyles.h2hRecordLabels}>
                <span style={{ color: "#639922" }}>{winsA} wins</span>
                <span style={{ color: "var(--text-faint)" }}>{draws} draws</span>
                <span style={{ color: "#E24B4A" }}>{winsB} wins</span>
              </div>
              <div className={teamStyles.predBar} style={{ marginBottom: 20 }}>
                <div style={{ width: `${Math.round(winsA/total*100)}%`, background: "#639922", height: "100%", borderRadius: "100px 0 0 100px" }} />
                <div style={{ width: `${Math.round(draws/total*100)}%`, background: "#555", height: "100%" }} />
                <div style={{ width: `${Math.round(winsB/total*100)}%`, background: "#E24B4A", height: "100%", borderRadius: "0 100px 100px 0" }} />
              </div>
              <p className={teamStyles.sectionLabel}>{matches.length} matches played</p>
              {matches.map((m, i) => {
                const aIsHome = m.homeTeam === selectedA?.name;
                const aScore  = aIsHome ? m.homeScore : m.awayScore;
                const bScore  = aIsHome ? m.awayScore : m.homeScore;
                const winner  = m.winner === "DRAW" ? "D" : ((m.winner === "HOME_TEAM") === aIsHome) ? "A" : "B";
                return (
                  <div key={m.id || i} className={teamStyles.matchRow}>
                    <span className={teamStyles.matchDate}>{m.date}</span>
                    <span className={teamStyles.matchOpp} style={{ color: winner === "A" ? "#639922" : "#aaa" }}>
                      {selectedA?.short || selectedA?.name}
                    </span>
                    <span className={teamStyles.matchScore}>{aScore}–{bScore}</span>
                    <span className={teamStyles.matchOpp} style={{ color: winner === "B" ? "#E24B4A" : "#aaa", textAlign: "right" }}>
                      {selectedB?.short || selectedB?.name}
                    </span>
                    <span className={teamStyles.matchComp}>{m.competition}</span>
                  </div>
                );
              })}
              <button className={teamStyles.h2hResetBtn} onClick={handleReset}>Clear</button>
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
      <div className={teamStyles.teamCard}>
        <div className={teamStyles.teamCardHeader}>
          <img src={team.crest} alt={team.name} className={teamStyles.teamCrest}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className={teamStyles.teamCardInfo}>
            <h3 className={teamStyles.teamName}>{team.name}</h3>
            <p className={teamStyles.teamMeta}>
              {team.founded ? `Est. ${team.founded}` : ""}
              {team.venue ? ` · ${team.venue}` : ""}
            </p>
            <p className={teamStyles.teamColors}>{team.colors}</p>
          </div>
          <div className={teamStyles.teamActions}>
            <button className={teamStyles.actionBtn} onClick={() => setShowSquad(true)}>Squad</button>
            <button className={teamStyles.actionBtn} onClick={() => setShowForm(true)}>Form</button>
          </div>
        </div>
      </div>
      {showSquad && <SquadModal team={team} onClose={() => setShowSquad(false)} />}
      {showForm  && <FormModal  team={team} onClose={() => setShowForm(false)}  />}
    </>
  );
}

function TeamsPanel({ compId }) {
  const [search, setSearch] = useState("");
  const { data, loading, error } = useFetch(() => fetchTeams(compId), [compId]);
  const filtered = (data || []).filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <input className={teamStyles.searchBox} placeholder="Search team..."
        value={search} onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 14 }} />
      {loading && <LoadingState message="Loading teams..." />}
      {error   && <ErrorState message={error} />}
      <div className={teamStyles.teamsList}>
        {filtered.map((team) => <TeamCard key={team.id} team={team} />)}
      </div>
      {data && data.length > 0 && <H2HSection teams={data} />}
    </div>
  );
}

export default function FootballView() {
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

  const [comp, setComp] = useState("PL");
  const [subView, setSubView] = useState("standings"); // "standings" | "teams" | "fixtures"
  const selected = TOURNAMENTS.find((c) => c.id === comp);
  const showTeamsToggle = TEAMS_CAPABLE.has(comp);

  function selectComp(id) {
    setComp(id);
    setSubView("standings");
  }

  return (
    <div>
      <SportsRecents sport="football" />
      <div className={styles.kpiRow}>
        {LEADER_CARDS.map((c) => <LeaderCard key={c.compId} {...c} />)}
      </div>

      <div className={styles.compTabs}>
        {TOURNAMENTS.map((c) => (
          <button
            key={c.id}
            className={`${styles.compTab} ${comp === c.id ? styles.compTabActive : ""}`}
            style={comp === c.id ? { background: c.color, borderColor: c.color, color: "#fff" } : {}}
            onClick={() => selectComp(c.id)}
          >
            {c.flag} {c.name}
          </button>
        ))}
      </div>

      {comp === "WC" ? (
        <>
          <div className={styles.panel} style={{ marginBottom: 16 }}>
            <h3 className={styles.panelTitle}>Knockout Schedule</h3>
            {WC_FIXTURES.map((m, i) => (
              <div key={i} className={styles.matchRow}>
                <span className={styles.matchHome}>{flagFor(m.home)} {m.home}</span>
                <div className={styles.matchScore}>
                  <span className={styles.scoreDash} style={{ fontSize: 12 }}>{m.time}</span>
                </div>
                <span className={styles.matchAway}>{flagFor(m.away)} {m.away}</span>
                <span className={styles.matchStage}>{m.stage} · {m.date}</span>
              </div>
            ))}
          </div>
          <WorldCupSemifinals />
        </>
      ) : (
        <div className={styles.panel} id="standings">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <h3 className={styles.panelTitle}>{selected?.flag} {selected?.name}</h3>
            {showTeamsToggle && (
              <div className={teamStyles.leagueTabs} style={{ marginBottom: 0 }}>
                <button
                  className={`${teamStyles.leagueTab} ${subView === "standings" ? teamStyles.leagueTabActive : ""}`}
                  onClick={() => setSubView("standings")}
                >Standings</button>
                <button
                  className={`${teamStyles.leagueTab} ${subView === "fixtures" ? teamStyles.leagueTabActive : ""}`}
                  onClick={() => setSubView("fixtures")}
                >Fixtures</button>
                <button
                  className={`${teamStyles.leagueTab} ${subView === "teams" ? teamStyles.leagueTabActive : ""}`}
                  onClick={() => setSubView("teams")}
                >Teams &amp; Squads</button>
              </div>
            )}
          </div>

          {comp === "CL" ? (
            <div>
              <p className={styles.eventLabel}>Round of 16 · 2025–26</p>
              {UCL_LAST16.map((m, i) => (
                <div key={i} className={styles.matchRow}>
                  <span className={styles.matchHome}>{m.home}</span>
                  <div className={styles.matchScore}>
                    <span className={styles.scoreNum}>{m.homeScore}</span>
                    <span className={styles.scoreDash}>–</span>
                    <span className={styles.scoreNum}>{m.awayScore}</span>
                  </div>
                  <span className={styles.matchAway}>{m.away}</span>
                  <span className={styles.matchStage}>{m.stage}</span>
                </div>
              ))}
            </div>
          ) : subView === "fixtures" && showTeamsToggle ? (
            <FixturesPanel compId={comp} />
          ) : subView === "teams" && showTeamsToggle ? (
            <TeamsPanel compId={comp} />
          ) : (
            <StandingsPanel compId={comp} compName={selected?.name} />
          )}
        </div>
      )}
    </div>
  );
}
