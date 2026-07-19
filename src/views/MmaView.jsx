import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { fetchUFCRecentResults, fetchUFCUpcomingCard } from "../api";
import Countdown from "../components/Countdown";
import { FighterModal } from "../components/Modal";
import { LoadingState, ErrorState, LiveBadge } from "../components/StatusStates";
import styles from "./MmaView.module.css";
import Hero from "../components/Hero";
import SeasonRecap from "../components/SeasonRecap";

function methodStyle(type) {
  if (type === "finish")
    return { background: "#E24B4A18", color: "#E24B4A", border: "1px solid #E24B4A30" };
  return { background: "#ffffff08", color: "#888", border: "1px solid #ffffff15" };
}

function formatEventDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export default function MmaView() {
  const [selectedFighter, setSelectedFighter] = useState(null);

  const recent   = useFetch(fetchUFCRecentResults);
  const upcoming = useFetch(fetchUFCUpcomingCard);

  // Flatten all fights across the fetched recent events for KPI math
  const allFights   = (recent.data || []).flatMap((ev) => ev.fights);
  const finishes    = allFights.filter((f) => f.methodType === "finish").length;
  const decisions   = allFights.filter((f) => f.methodType === "decision").length;
  const finishRate  = allFights.length ? Math.round((finishes / allFights.length) * 100) : 0;

  const lastEvent   = recent.data?.[0];
  const lastMainFight = lastEvent?.fights?.[0];
  const titleFight  = allFights.find((f) => f.title);

  return (
    <div>
      <Hero pageKey="mma" />
      <SeasonRecap pageKey="mma" />

      {upcoming.loading
        ? <div className={styles.kpi} style={{ marginBottom: 20 }}><p className={styles.kpiSub}>Loading next event...</p></div>
        : upcoming.data && (
          <Countdown
            eventName={upcoming.data.name}
            venueName={formatEventDate(upcoming.data.date)}
            target={upcoming.data.date}
          />
        )
      }

      {/* KPI strip */}
      <div className={styles.kpiRow}>
        {[
          { label: "Last Event",        val: lastEvent?.event || "—",                sub: formatEventDate(lastEvent?.date) },
          { label: "Main Event Result", val: lastMainFight ? `${lastMainFight.method} — ${lastMainFight.round}` : "—", sub: lastMainFight ? `${lastMainFight.winner} def. ${lastMainFight.loser}` : "" },
          { label: "Title Fight",       val: titleFight?.winner || "—",              sub: titleFight ? `${titleFight.method} · ${titleFight.round}` : "" },
          { label: "Finish Rate",       val: `${finishRate}%`, sub: `${finishes} finishes · ${decisions} decisions` },
        ].map((k) => (
          <div key={k.label} className={styles.kpi}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={styles.kpiVal}>{k.val}</p>
            <p className={styles.kpiSub}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div className={styles.grid}>

        {/* ── Recent Results ── */}
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>
            Recent Results <LiveBadge />
            <span className={styles.hint}>click a row for fighter profile</span>
          </h3>

          {recent.loading && <LoadingState message="Fetching recent results..." />}
          {recent.error   && <ErrorState message={recent.error} onRetry={recent.refetch} />}
          {recent.data && recent.data.length === 0 && (
            <p className={styles.eventLabel}>No completed events found.</p>
          )}

          {recent.data?.map((ev) => (
            <div key={ev.event} className={styles.eventGroup}>
              <p className={styles.eventLabel}>{ev.event} — {formatEventDate(ev.date)}</p>
              {ev.fights.map((f) => (
                <button
                  key={f.fighterId}
                  className={styles.fightRow}
                  onClick={() => setSelectedFighter(f.winnerProfile)}
                >
                  <span className={styles.loser}>{f.loser}</span>
                  <div className={styles.center}>
                    <span className={styles.pill} style={methodStyle(f.methodType)}>{f.method}</span>
                    <span className={styles.roundInfo}>{f.round} · {f.time}</span>
                    {f.title && <span className={styles.titleBadge}>TITLE</span>}
                  </div>
                  <span className={styles.winner}>
                    <span className={styles.winDot} />
                    {f.winner}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div>
          {/* ── Upcoming Card ── */}
          <div className={styles.panel} style={{ marginBottom: 16 }}>
            <h3 className={styles.panelTitle}>
              {upcoming.data ? `Next Card — ${formatEventDate(upcoming.data.date)}` : "Next Card"} <LiveBadge />
            </h3>
            <p className={styles.eventLabel}>{upcoming.data?.name || (upcoming.loading ? "Loading..." : "No upcoming card found")}</p>

            {upcoming.loading && <LoadingState message="Fetching upcoming card..." />}
            {upcoming.error   && <ErrorState message={upcoming.error} onRetry={upcoming.refetch} />}

            {upcoming.data?.fights.map((f, i) => (
              <div key={i} className={styles.upcomingRow}>
                <div>
                  <p className={styles.upcomingBout}>{f.bout}</p>
                  <p className={styles.upcomingDetail}>{f.division} · {f.card}</p>
                </div>
                <span className={styles.upcomingDate}>{formatEventDate(f.date)}</span>
              </div>
            ))}
          </div>

          {/* ── Finish Breakdown ── */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Finish Breakdown</h3>
            <p className={styles.eventLabel}>Last {allFights.length || 0} fights</p>
            <div className={styles.finishBars}>
              {[
                { label: "KO / TKO",   count: allFights.filter((f) => f.method === "KO").length,  color: "#E24B4A" },
                { label: "Submission", count: allFights.filter((f) => f.method === "Sub").length, color: "#378ADD" },
                { label: "Decision",   count: decisions, color: "#888780" },
              ].map((b) => (
                <div key={b.label} className={styles.barRow}>
                  <span className={styles.barLabel}>{b.label}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${allFights.length ? Math.round((b.count / allFights.length) * 100) : 0}%`, background: b.color }} />
                  </div>
                  <span className={styles.barCount}>{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedFighter && (
        <FighterModal fighter={selectedFighter} onClose={() => setSelectedFighter(null)} />
      )}
    </div>
  );
}
