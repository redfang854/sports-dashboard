import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import {
  FOOTBALL_COMPETITIONS, EPL_STANDINGS_STATIC, LA_LIGA_STATIC,
  SERIE_A_STATIC, BUNDESLIGA_STATIC, UCL_LAST16,
} from "../data/football";
import { LoadingState, ErrorState, LiveBadge } from "../components/StatusStates";
import styles from "./FootballView.module.css";

const API_KEY = "123ac3c7dc69470d81a805c765399492";
const BASE    = "https://api.football-data.org/v4";

const STATIC_STANDINGS = {
  PL: EPL_STANDINGS_STATIC, PD: LA_LIGA_STATIC,
  SA: SERIE_A_STATIC, BL1: BUNDESLIGA_STATIC,
};

async function fetchStandings(compId) {
  const res = await fetch(`/api/standings?comp=${compId}`);
  if (res.status === 429) throw new Error("Rate limited — try again in a moment");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.standings[0].table.slice(0, 10).map((e) => ({
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

const posColor = (p) =>
  p === 1 ? "#BA7517" : p === 2 ? "#999" : p === 3 ? "#7F77DD"
  : p <= 4 ? "#378ADD" : p >= 18 ? "#E24B4A" : "#555";

function StandingsPanel({ compId, compName }) {
  const { data, loading, error, refetch } = useFetch(() => fetchStandings(compId), [compId]);
  const rows   = data || STATIC_STANDINGS[compId] || [];
  const topPts = rows[0]?.pts ?? 1;

  return (
    <div>
      <div className={styles.panelMeta}>
        {data ? <LiveBadge /> : <span className={styles.staticBadge}>Updated Apr 2026</span>}
      </div>
      {loading && <LoadingState message={`Loading ${compName}...`} />}
      {error   && <ErrorState message={error} onRetry={refetch} />}
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
      <div className={styles.colHeaders}>
        <span style={{ flex: 1 }} />
        {["P","W","L","GD","Pts"].map((h) => <span key={h} className={styles.colHeader}>{h}</span>)}
      </div>
    </div>
  );
}

export default function FootballView() {
  const [comp, setComp] = useState("PL");
  const selected = FOOTBALL_COMPETITIONS.find((c) => c.id === comp);

  return (
    <div>
      <div className={styles.kpiRow}>
        {[
          { label: "EPL Leaders",     val: "Liverpool",   sub: "77 pts · 24W" },
          { label: "La Liga Leaders", val: "Barcelona",   sub: "73 pts · 23W" },
          { label: "Serie A Leaders", val: "Napoli",      sub: "72 pts · 22W" },
          { label: "UCL Last 16",     val: "Real Madrid", sub: "Won 3–1 vs Man City" },
        ].map((k) => (
          <div key={k.label} className={styles.kpi}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={styles.kpiVal}>{k.val}</p>
            <p className={styles.kpiSub}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div className={styles.compTabs}>
        {FOOTBALL_COMPETITIONS.map((c) => (
          <button
            key={c.id}
            className={`${styles.compTab} ${comp === c.id ? styles.compTabActive : ""}`}
            style={comp === c.id ? { background: c.color, borderColor: c.color, color: "#fff" } : {}}
            onClick={() => setComp(c.id)}
          >
            {c.flag} {c.name}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>{selected?.flag} {selected?.name}</h3>
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
          ) : (
            <StandingsPanel compId={comp} compName={selected?.name} />
          )}
        </div>

        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Competitions</h3>
          <p className={styles.eventLabel}>Select a league to view standings</p>
          {FOOTBALL_COMPETITIONS.map((c) => (
            <button
              key={c.id}
              className={`${styles.leagueCard} ${comp === c.id ? styles.leagueCardActive : ""}`}
              onClick={() => setComp(c.id)}
            >
              <span className={styles.leagueFlag}>{c.flag}</span>
              <span className={styles.leagueName}>{c.name}</span>
              <span className={styles.leagueArrow}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
