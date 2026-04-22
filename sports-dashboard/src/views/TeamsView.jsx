import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import {
  fetchTeams, fetchSquad, fetchPlayerStats,
  fetchH2H, fetchTeamForm, LEAGUE_IDS, SEASON,
} from "../api/apisports";
import { LoadingState, ErrorState, LiveBadge } from "../components/StatusStates";
import styles from "./TeamsView.module.css";

const LEAGUES = [
  { code: "PL",  name: "Premier League",  flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "PD",  name: "La Liga",         flag: "🇪🇸" },
  { code: "SA",  name: "Serie A",         flag: "🇮🇹" },
  { code: "BL1", name: "Bundesliga",      flag: "🇩🇪" },
  { code: "FL1", name: "Ligue 1",         flag: "🇫🇷" },
];

const POSITIONS = ["All", "Goalkeeper", "Defender", "Midfielder", "Attacker"];

// ─── Player Modal ─────────────────────────────────────────────────────────────
function PlayerModal({ playerId, leagueId, onClose }) {
  const { data, loading, error } = useFetch(
    () => fetchPlayerStats(playerId, leagueId), [playerId]
  );

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        {loading && <LoadingState message="Loading player stats..." />}
        {error   && <ErrorState message={error} />}
        {data && (
          <>
            <div className={styles.playerHeader}>
              <img src={data.photo} alt={data.name} className={styles.playerPhoto}
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <div>
                <h2 className={styles.playerName}>{data.name}</h2>
                <p className={styles.playerMeta}>{data.nationality} · {data.position} · Age {data.age}</p>
                <div className={styles.playerTeamRow}>
                  {data.teamLogo && <img src={data.teamLogo} alt={data.team} className={styles.teamLogoSm} />}
                  <span className={styles.playerTeam}>{data.team}</span>
                </div>
              </div>
            </div>

            <div className={styles.physRow}>
              {[
                { label: "Height", val: data.height || "—" },
                { label: "Weight", val: data.weight || "—" },
                { label: "Rating", val: data.rating || "—" },
                { label: "Injured", val: data.injured ? "Yes" : "No" },
              ].map((s) => (
                <div key={s.label} className={styles.physCard}>
                  <span className={styles.physVal}>{s.val}</span>
                  <span className={styles.physLabel}>{s.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.statsHeading}>2024/25 Season Stats</div>
            <div className={styles.statsGrid}>
              {[
                { label: "Appearances", val: data.appearances ?? "—" },
                { label: "Minutes",     val: data.minutes ?? "—" },
                { label: "Goals",       val: data.goals },
                { label: "Assists",     val: data.assists },
                { label: "Key Passes",  val: data.keyPasses ?? "—" },
                { label: "Tackles",     val: data.tackles ?? "—" },
                { label: "Yellow",      val: data.yellowCards },
                { label: "Red",         val: data.redCards },
              ].map((s) => (
                <div key={s.label} className={styles.statBox}>
                  <span className={styles.statVal}>{s.val}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── H2H Panel ────────────────────────────────────────────────────────────────
function H2HPanel({ team1, team2, onClose }) {
  const { data, loading, error } = useFetch(
    () => fetchH2H(team1.id, team2.id), [team1.id, team2.id]
  );

  const wins  = data?.filter((f) => f.winner === "home" && f.homeTeam === team1.name || f.winner === "away" && f.awayTeam === team1.name).length || 0;
  const wins2 = data?.filter((f) => f.winner === "home" && f.homeTeam === team2.name || f.winner === "away" && f.awayTeam === team2.name).length || 0;
  const draws = data?.filter((f) => f.winner === "draw").length || 0;

  // Simple prediction based on H2H + form
  const total = (wins + wins2 + draws) || 1;
  const pred1 = Math.round((wins / total) * 100);
  const pred2 = Math.round((wins2 / total) * 100);
  const predD = 100 - pred1 - pred2;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: 500 }}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.h2hHeader}>
          <div className={styles.h2hTeam}>
            <img src={team1.logo} alt={team1.name} className={styles.h2hLogo} />
            <span className={styles.h2hTeamName}>{team1.name}</span>
          </div>
          <span className={styles.h2hVs}>vs</span>
          <div className={styles.h2hTeam} style={{ alignItems: "flex-end" }}>
            <img src={team2.logo} alt={team2.name} className={styles.h2hLogo} />
            <span className={styles.h2hTeamName}>{team2.name}</span>
          </div>
        </div>

        {loading && <LoadingState message="Loading head-to-head..." />}
        {error   && <ErrorState message={error} />}

        {data && (
          <>
            {/* Record summary */}
            <div className={styles.recordBar}>
              <div className={styles.recordItem} style={{ color: "#639922" }}>
                <span className={styles.recordNum}>{wins}</span>
                <span className={styles.recordLbl}>{team1.name.split(" ")[0]} wins</span>
              </div>
              <div className={styles.recordItem} style={{ color: "#888" }}>
                <span className={styles.recordNum}>{draws}</span>
                <span className={styles.recordLbl}>Draws</span>
              </div>
              <div className={styles.recordItem} style={{ color: "#E24B4A" }}>
                <span className={styles.recordNum}>{wins2}</span>
                <span className={styles.recordLbl}>{team2.name.split(" ")[0]} wins</span>
              </div>
            </div>

            {/* Prediction bar */}
            <div className={styles.predSection}>
              <p className={styles.predTitle}>Prediction (based on H2H record)</p>
              <div className={styles.predBar}>
                <div className={styles.predFill} style={{ width: `${pred1}%`, background: "#639922" }} />
                <div className={styles.predFill} style={{ width: `${predD}%`, background: "#555" }} />
                <div className={styles.predFill} style={{ width: `${pred2}%`, background: "#E24B4A" }} />
              </div>
              <div className={styles.predLabels}>
                <span style={{ color: "#639922" }}>{pred1}% {team1.name.split(" ")[0]}</span>
                <span style={{ color: "#888" }}>{predD}% Draw</span>
                <span style={{ color: "#E24B4A" }}>{pred2}% {team2.name.split(" ")[0]}</span>
              </div>
            </div>

            {/* Match history */}
            <p className={styles.statsHeading}>Last {data.length} Meetings</p>
            {data.map((f, i) => (
              <div key={i} className={styles.h2hMatch}>
                <span className={styles.h2hDate}>{f.date}</span>
                <span className={styles.h2hHome}>{f.homeTeam}</span>
                <span className={styles.h2hScore}>{f.homeScore} – {f.awayScore}</span>
                <span className={styles.h2hAway}>{f.awayTeam}</span>
                <span className={styles.h2hComp}>{f.competition}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────
function TeamCard({ team, onSelectTeam, selectedForH2H, onH2HSelect }) {
  const [showSquad, setShowSquad] = useState(false);
  const [posFilter, setPosFilter] = useState("All");
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const squad = useFetch(() => showSquad ? fetchSquad(team.id) : Promise.resolve(null), [showSquad, team.id]);
  const form  = useFetch(() => fetchTeamForm(team.id, 5), [team.id]);

  const filtered = squad.data?.filter(
    (p) => posFilter === "All" || p.position === posFilter
  ) || [];

  const formColors = { W: "#639922", D: "#888", L: "#E24B4A" };

  return (
    <div className={`${styles.teamCard} ${selectedForH2H ? styles.teamCardSelected : ""}`}>
      <div className={styles.teamCardHeader}>
        <img src={team.logo} alt={team.name} className={styles.teamLogo}
          onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <div className={styles.teamCardInfo}>
          <h3 className={styles.teamCardName}>{team.name}</h3>
          <p className={styles.teamCardMeta}>
            Founded {team.founded} · {team.venue} · Capacity {team.capacity?.toLocaleString()}
          </p>
          {/* Form dots */}
          <div className={styles.formRow}>
            {form.data?.map((f, i) => (
              <span key={i} className={styles.formDot} style={{ background: formColors[f.result] }}
                title={`${f.result} vs ${f.opponent} (${f.score})`} />
            ))}
          </div>
        </div>
        <div className={styles.teamCardActions}>
          <button className={styles.actionBtn} onClick={() => setShowSquad(!showSquad)}>
            {showSquad ? "Hide Squad" : "View Squad"}
          </button>
          <button
            className={`${styles.actionBtn} ${selectedForH2H ? styles.actionBtnActive : ""}`}
            onClick={() => onH2HSelect(team)}
          >
            H2H
          </button>
        </div>
      </div>

      {showSquad && (
        <div className={styles.squadSection}>
          <div className={styles.posFilter}>
            {POSITIONS.map((pos) => (
              <button key={pos}
                className={`${styles.posBtn} ${posFilter === pos ? styles.posBtnActive : ""}`}
                onClick={() => setPosFilter(pos)}
              >{pos}</button>
            ))}
          </div>

          {squad.loading && <LoadingState message="Loading squad..." />}
          {squad.error   && <ErrorState message={squad.error} />}

          <div className={styles.squadGrid}>
            {filtered.map((player) => (
              <button key={player.id} className={styles.playerCard}
                onClick={() => setSelectedPlayer(player.id)}>
                <img src={player.photo} alt={player.name} className={styles.playerThumb}
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=1a1a1a&color=fff&size=80`;
                  }} />
                <p className={styles.playerCardName}>{player.name}</p>
                <p className={styles.playerCardPos}>{player.position}</p>
                {player.number && <span className={styles.playerNum}>#{player.number}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedPlayer && (
        <PlayerModal
          playerId={selectedPlayer}
          leagueId={LEAGUE_IDS["PL"]}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}

// ─── MAIN VIEW ────────────────────────────────────────────────────────────────
export default function TeamsView() {
  const [league,  setLeague]  = useState("PL");
  const [search,  setSearch]  = useState("");
  const [h2hTeam1, setH2HTeam1] = useState(null);
  const [h2hTeam2, setH2HTeam2] = useState(null);
  const [showH2H, setShowH2H]   = useState(false);

  const teams = useFetch(() => fetchTeams(league), [league]);

  const filtered = (teams.data || []).filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleH2HSelect = (team) => {
    if (!h2hTeam1) {
      setH2HTeam1(team);
    } else if (!h2hTeam2 && team.id !== h2hTeam1.id) {
      setH2HTeam2(team);
      setShowH2H(true);
    } else {
      setH2HTeam1(team);
      setH2HTeam2(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.viewHeader}>
        <div>
          <h2 className={styles.viewTitle}>Teams & Squads</h2>
          <p className={styles.viewSub}>Full rosters, player stats, head-to-head, predictions · <LiveBadge /></p>
        </div>
        <input
          className={styles.searchBox}
          placeholder="Search team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* H2H banner */}
      {h2hTeam1 && (
        <div className={styles.h2hBanner}>
          <span className={styles.h2hBannerText}>
            H2H: <strong>{h2hTeam1.name}</strong>
            {h2hTeam2 ? <> vs <strong>{h2hTeam2.name}</strong></> : " — now select a second team"}
          </span>
          <button className={styles.h2hClear} onClick={() => { setH2HTeam1(null); setH2HTeam2(null); }}>Clear</button>
        </div>
      )}

      {/* League tabs */}
      <div className={styles.leagueTabs}>
        {LEAGUES.map((l) => (
          <button key={l.code}
            className={`${styles.leagueTab} ${league === l.code ? styles.leagueTabActive : ""}`}
            onClick={() => { setLeague(l.code); setSearch(""); }}>
            {l.flag} {l.name}
          </button>
        ))}
      </div>

      {teams.loading && <LoadingState message="Loading teams..." />}
      {teams.error   && <ErrorState message={teams.error} />}

      <div className={styles.teamsList}>
        {filtered.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            selectedForH2H={h2hTeam1?.id === team.id || h2hTeam2?.id === team.id}
            onH2HSelect={handleH2HSelect}
          />
        ))}
      </div>

      {showH2H && h2hTeam1 && h2hTeam2 && (
        <H2HPanel
          team1={h2hTeam1}
          team2={h2hTeam2}
          onClose={() => { setShowH2H(false); setH2HTeam1(null); setH2HTeam2(null); }}
        />
      )}
    </div>
  );
}
