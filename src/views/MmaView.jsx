import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { fetchUFCEvents } from "../api";
import { RECENT_FIGHTS, UPCOMING_FIGHTS, FIGHTERS } from "../data";
import Avatar from "../components/Avatar";
import { FIGHTER_IMAGES } from "../data/images";
import Countdown from "../components/Countdown";
import { FighterModal } from "../components/Modal";
import { LoadingState, ErrorState, LiveBadge } from "../components/StatusStates";
import styles from "./MmaView.module.css";

function methodStyle(type) {
  if (type === "finish")
    return { background: "#E24B4A18", color: "#E24B4A", border: "1px solid #E24B4A30" };
  return { background: "#ffffff08", color: "#888", border: "1px solid #ffffff15" };
}

// Group fights by event name
const groupedStatic = RECENT_FIGHTS.reduce((acc, f) => {
  (acc[f.event] = acc[f.event] || []).push(f);
  return acc;
}, {});

export default function MmaView() {
  const [selectedFighter, setSelectedFighter] = useState(null);

  // Try to load live UFC events — falls back to static data on error
  const events = useFetch(fetchUFCEvents);

  const finishes  = RECENT_FIGHTS.filter((f) => f.methodType === "finish").length;
  const decisions = RECENT_FIGHTS.filter((f) => f.methodType === "decision").length;

  // Use live upcoming events if available, else static
  const upcomingEvents = events.data?.upcoming ?? [];
  const nextEventName  = upcomingEvents[0]?.strEvent ?? "Sterling vs Zalal";
  const nextEventDate  = upcomingEvents[0]?.dateEvent ?? "2026-04-26";

  return (
    <div>
      <Countdown
        eventName={`UFC: ${nextEventName}`}
        venueName={`${nextEventDate}`}
        target={`${nextEventDate}T00:00:00Z`}
      />

      <div className={styles.kpiRow}>
        {[
          { label: "Last Event", val: "Burns vs Malott", sub: "Apr 19, 2026" },
          { label: "Main Event Result", val: "KO — R3", sub: "Malott def. Burns · 2:08" },
          { label: "Title Fight", val: "Ulberg", sub: "New LHW Champion" },
          { label: "Finish Rate", val: `${Math.round((finishes / RECENT_FIGHTS.length) * 100)}%`, sub: `${finishes} finishes, ${decisions} decisions` },
        ].map((k) => (
          <div key={k.label} className={styles.kpi}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={styles.kpiVal}>{k.val}</p>
            <p className={styles.kpiSub}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {/* ── Recent Results (static — UFC doesn't expose fight-level free API) ── */}
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>
            Recent Results
            <span className={styles.hint}>click a row for fighter profile</span>
          </h3>

          {Object.entries(groupedStatic).map(([event, fights]) => (
            <div key={event} className={styles.eventGroup}>
              <p className={styles.eventLabel}>{event}</p>
              {fights.map((f) => (
                <button
                  key={f.fighterId}
                  className={styles.fightRow}
                  onClick={() => setSelectedFighter(FIGHTERS[f.fighterId])}
                >
                  <span className={styles.loser}>{f.loser}</span>
                  <div className={styles.center}>
                    <span className={styles.pill} style={methodStyle(f.methodType)}>
                      {f.method}
                    </span>
                    <span className={styles.roundInfo}>{f.round} · {f.time}</span>
                    {f.title && <span className={styles.titleBadge}>TITLE</span>}
                  </div>
                  <span className={styles.winner} style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6}}>
                    <span className={styles.winDot} />
                    {f.winner}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div>
          {/* ── Upcoming Events (live from TheSportsDB) ── */}
          <div className={styles.panel} style={{ marginBottom: 16 }}>
            <h3 className={styles.panelTitle}>
              Upcoming Events
              <LiveBadge />
            </h3>

            {events.loading && <LoadingState message="Fetching upcoming events..." />}
            {events.error && (
              <>
                <ErrorState message="Could not load live events" onRetry={events.refetch} />
                {/* Fallback to static */}
                {UPCOMING_FIGHTS.map((f) => (
                  <div key={f.bout} className={styles.upcomingRow}>
                    <div>
                      <p className={styles.upcomingBout}>{f.bout}</p>
                      <p className={styles.upcomingDetail}>{f.division} · {f.card}</p>
                    </div>
                    <span className={styles.upcomingDate}>{f.date}</span>
                  </div>
                ))}
              </>
            )}

            {events.data && upcomingEvents.length === 0 && (
              <p style={{ fontSize: 13, color: "#555", padding: "12px 0" }}>No upcoming events found.</p>
            )}

            {events.data && upcomingEvents.map((e) => (
              <div key={e.idEvent} className={styles.upcomingRow}>
                <div>
                  <p className={styles.upcomingBout}>{e.strEvent}</p>
                  <p className={styles.upcomingDetail}>{e.strVenue || "TBA"}</p>
                </div>
                <span className={styles.upcomingDate}>{e.dateEvent}</span>
              </div>
            ))}
          </div>

          {/* ── Finish Breakdown ── */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Finish Breakdown</h3>
            <p className={styles.eventLabel}>Last {RECENT_FIGHTS.length} fights</p>
            <div className={styles.finishBars}>
              {[
                { label: "KO / TKO", count: RECENT_FIGHTS.filter((f) => f.method === "KO").length, color: "#E24B4A" },
                { label: "Submission", count: RECENT_FIGHTS.filter((f) => f.method === "Sub").length, color: "#378ADD" },
                { label: "Decision", count: decisions, color: "#888780" },
              ].map((b) => (
                <div key={b.label} className={styles.barRow}>
                  <span className={styles.barLabel}>{b.label}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${Math.round((b.count / RECENT_FIGHTS.length) * 100)}%`, background: b.color }}
                    />
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
