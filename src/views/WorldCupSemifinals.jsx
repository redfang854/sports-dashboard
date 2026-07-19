import { useState } from "react";
import styles from "./WorldCupSemifinals.module.css";
import { flagFor } from "../data/countryFlags";

// Static World Cup 2026 semifinalist data — sourced from public lineup
// reports + Wikipedia (CC-licensed photos). See each JSON file's "source"
// and "note" fields for provenance and freshness caveats.
import france from "../data/worldcup/france.json";
import spain from "../data/worldcup/spain.json";
import england from "../data/worldcup/england.json";
import argentina from "../data/worldcup/argentina.json";

const TEAMS = [france, spain, england, argentina];

// Turns "4-2-3-1" into [4, 2, 3, 1]. Combined with the fixed GK slot,
// this tells us how many players sit in each line from back to front.
function formationLines(formationStr) {
  return formationStr.split("-").map((n) => parseInt(n, 10)).filter(Boolean);
}

// Players in each team's starting_xi are already listed in formation order
// (GK, then back to front), so we can slice them into lines directly —
// no per-player coordinates needed in the data files.
function layoutPlayers(team) {
  const lines = formationLines(team.formation);
  const groups = [];
  let idx = 0;

  groups.push(team.starting_xi.slice(idx, idx + 1)); // GK
  idx += 1;
  for (const n of lines) {
    groups.push(team.starting_xi.slice(idx, idx + n));
    idx += n;
  }

  const numRows = groups.length;
  const positioned = [];

  groups.forEach((group, rowIdx) => {
    // Row 0 (GK) sits deep at y=90; last row (attack) sits high at y=12.
    const y = numRows === 1 ? 50 : 90 - rowIdx * (78 / (numRows - 1));
    const n = group.length;
    group.forEach((player, i) => {
      const x = n === 1 ? 50 : 15 + i * (70 / (n - 1));
      positioned.push({ player, x, y });
    });
  });

  return positioned;
}

function PitchNode({ player, x, y }) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    player.name
  )}&background=922b21&color=fff&size=80&bold=true&rounded=true`;

  return (
    <div className={styles.pitchNode} style={{ left: `${x}%`, top: `${y}%` }}>
      <img
        src={player.photo || fallback}
        alt={player.name}
        className={styles.pitchPhoto}
        onError={(e) => { e.target.src = fallback; }}
      />
      <p className={styles.pitchName}>
        {player.name.split(" ").pop()}
        {player.captain && <span className={styles.captainBadge}> C</span>}
      </p>
    </div>
  );
}

function Pitch({ team }) {
  const positioned = layoutPlayers(team);
  return (
    <div className={styles.pitch}>
      <div className={styles.pitchHalfway} />
      <div className={styles.pitchCircle} />
      <div className={styles.pitchBoxTop} />
      <div className={styles.pitchBoxBottom} />
      {positioned.map(({ player, x, y }) => (
        <PitchNode key={player.name} player={player} x={x} y={y} />
      ))}
    </div>
  );
}

function TeamCard({ team }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.teamCard}>
      <div className={styles.teamCardHeader} onClick={() => setExpanded((v) => !v)}>
        <div className={styles.teamCardInfo}>
          <h3 className={styles.teamName}>{flagFor(team.team)} {team.team}</h3>
          <p className={styles.teamMeta}>
            {team.formation} · {team.coach}
          </p>
        </div>
        <span className={styles.expandIcon}>{expanded ? "−" : "+"}</span>
      </div>

      {expanded && (
        <>
          <Pitch team={team} />
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
