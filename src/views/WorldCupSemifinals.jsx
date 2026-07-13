import { useEffect, useState } from "react";
import styles from "./WorldCupSemifinals.module.css";

// Static World Cup 2026 semifinalist data — sourced from public lineup
// reports + Wikipedia (CC-licensed photos). See each JSON file's "source"
// and "note" fields for provenance and freshness caveats.
import france from "../data/worldcup/france.json";
import spain from "../data/worldcup/spain.json";
import england from "../data/worldcup/england.json";
import argentina from "../data/worldcup/argentina.json";

const TEAMS = [france, spain, england, argentina];

function PlayerCard({ player }) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    player.name
  )}&background=922b21&color=fff&size=80&bold=true&rounded=true`;

  return (
    <div className={styles.playerCard}>
      <img
        src={player.photo || fallback}
        alt={player.name}
        className={styles.playerPhoto}
        onError={(e) => {
          e.target.src = fallback;
        }}
      />
      <p className={styles.playerName}>
        {player.name}
        {player.captain && <span className={styles.captainBadge}> C</span>}
      </p>
      <p className={styles.playerPos}>{player.position}</p>
    </div>
  );
}

function TeamCard({ team }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.teamCard}>
      <div className={styles.teamCardHeader} onClick={() => setExpanded((v) => !v)}>
        <div className={styles.teamCardInfo}>
          <h3 className={styles.teamName}>{team.team}</h3>
          <p className={styles.teamMeta}>
            {team.formation} · {team.coach}
          </p>
        </div>
        <span className={styles.expandIcon}>{expanded ? "−" : "+"}</span>
      </div>

      {expanded && (
        <>
          <p className={styles.sectionLabel}>Starting XI</p>
          <div className={styles.squadGrid}>
            {team.starting_xi.map((p) => (
              <PlayerCard key={p.name} player={p} />
            ))}
          </div>
          {team.note && <p className={styles.note}>{team.note}</p>}
        </>
      )}
    </div>
  );
}

export default function WorldCupSemifinals() {
  return (
    <div>
      <div className={styles.viewHeader}>
        <div>
          <h2 className={styles.viewTitle}>World Cup 2026 · Semifinals</h2>
          <p className={styles.viewSub}>France · Spain · England · Argentina</p>
        </div>
      </div>
      <div className={styles.teamsList}>
        {TEAMS.map((team) => (
          <TeamCard key={team.team} team={team} />
        ))}
      </div>
    </div>
  );
}
