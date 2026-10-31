import { useState, useEffect } from "react";
import {
  BOXING_DIVISIONS, BOXING_UPDATED, BOXING_SOURCE, BODIES,
  championsFrom, latestTitleChanges, isUndisputed,
} from "../data/boxing";
import UpdatedNote from "../components/UpdatedNote";
import styles from "./BoxingView.module.css";
import SportsRecents from "../components/SportsRecents";

// Lightened sanctioning-body colours so badge text passes WCAG AA (>=5:1) on the dark cards.
const BELT_COLORS = { WBA: "#FF5A5A", WBC: "#2FBF71", IBF: "#6A9BFF", WBO: "#B07CFF", Ring: "#E0A030" };
const beltLabel = (b) => (b === "Ring" ? "The Ring" : b);
const fmtDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function BeltBadge({ body }) {
  const c = BELT_COLORS[body];
  return <span className={styles.beltBadge} style={{ background: c + "22", color: c, borderColor: c + "55" }}>{beltLabel(body)}</span>;
}

function ChampionModal({ champion, onClose }) {
  if (!champion) return null;
  const { record } = champion;
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={champion.name}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        <div className={styles.modalHeader}>
          <div className={styles.modalAvatar}>
            {champion.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h2 className={styles.modalName}>{champion.name}</h2>
            <p className={styles.modalSub}>{champion.division}{champion.undisputed ? " · Undisputed" : ""}</p>
            <div className={styles.beltRow}>
              {champion.belts.map((b) => <BeltBadge key={b.body} body={b.body} />)}
            </div>
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
            <span className={styles.recNum} style={{ color: "#A8B3C7" }}>{record.d}</span>
            <span className={styles.recLabel}>Draws</span>
          </div>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.stat}><span className={styles.statVal}>{champion.ko}</span><span className={styles.statLabel}>KO wins</span></div>
          <div className={styles.stat}><span className={styles.statVal}>{champion.koRate}%</span><span className={styles.statLabel}>KO rate</span></div>
        </div>
        <div className={styles.bio}>
          {champion.belts.map((b) => (
            <p key={b.body}>{beltLabel(b.body)} champion since {fmtDate(b.since)}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BoxingView() {
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

  const [selected, setSelected] = useState(null);

  const champions  = championsFrom();
  const featured   = champions.filter((c) => c.belts.length >= 2);
  const undisputed = BOXING_DIVISIONS.filter(isUndisputed);
  const unbeaten   = champions.filter((c) => c.record.l === 0);
  const latest     = latestTitleChanges();
  const top        = featured[0];

  const kpis = [
    { label: "Undisputed Champions", val: String(undisputed.length),
      sub: undisputed.map((d) => `${champions.find((c) => c.division === d.division && c.undisputed)?.name} · ${d.division}`).join(", ") || "None right now" },
    { label: "Most Belts", val: top ? top.name.split(" ").pop() : "—",
      sub: top ? `${top.belts.map((b) => beltLabel(b.body)).join(" · ")}` : "" },
    { label: "Latest Title Change", val: latest[0] ? latest[0].name.split(" ").pop() : "—",
      sub: latest[0] ? `${latest[0].bodies.map(beltLabel).join("/")} ${latest[0].division} · ${fmtDate(latest[0].since)}` : "" },
    { label: "Unbeaten Champions", val: String(unbeaten.length), sub: `of ${champions.length} current titleholders` },
  ];

  return (
    <div>
      <SportsRecents sport="boxing" />
      <div className={styles.kpiRow}>
        {kpis.map((k) => (
          <div key={k.label} className={styles.kpi}>
            <p className={styles.kpiLabel}>{k.label}</p>
            <p className={styles.kpiVal}>{k.val}</p>
            <p className={styles.kpiSub}>{k.sub}</p>
          </div>
        ))}
      </div>
      <UpdatedNote date={BOXING_UPDATED} source={BOXING_SOURCE} />

      <div className={styles.grid}>
        <div className={styles.panel} id="champions">
          <h3 className={styles.panelTitle}>
            Unified Champions
            <span className={styles.hint}>click for profile</span>
          </h3>
          {featured.map((c) => (
            <button key={c.id} className={styles.championRow} onClick={() => setSelected(c)}>
              <div className={styles.champAvatar}>
                {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className={styles.champInfo}>
                <p className={styles.champName}>{c.name}</p>
                <p className={styles.champDivision}>{c.division}{c.undisputed ? " · Undisputed" : ""}</p>
                <div className={styles.beltRow}>
                  {c.belts.map((b) => <BeltBadge key={b.body} body={b.body} />)}
                </div>
              </div>
              <div className={styles.champRecord}>
                <span className={styles.recordBig}>{c.recordText}</span>
                <span className={styles.recordSub}>{c.koRate}% KO</span>
              </div>
            </button>
          ))}
        </div>

        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Latest Title Changes</h3>
          {latest.map((t) => (
            <div key={`${t.name}-${t.since}`} className={styles.fightRow}>
              <div>
                <p className={styles.winner}>{t.name}</p>
                <p className={styles.boutDetail}>{t.division} · {fmtDate(t.since)}</p>
              </div>
              <div className={styles.beltRow} style={{ justifyContent: "flex-end", flexShrink: 0 }}>
                {t.bodies.map((b) => <BeltBadge key={b} body={b} />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.panel} style={{ marginTop: 16 }} id="divisions">
        <h3 className={styles.panelTitle}>Champions by Division</h3>
        <div className={styles.tableWrap}>
          <table className={styles.divTable}>
            <thead>
              <tr>
                <th scope="col">Division</th>
                {BODIES.map((b) => <th key={b} scope="col">{beltLabel(b)}</th>)}
              </tr>
            </thead>
            <tbody>
              {BOXING_DIVISIONS.map((d) => (
                <tr key={d.division} className={isUndisputed(d) ? styles.undisputedRow : undefined}>
                  <th scope="row">{d.division}</th>
                  {BODIES.map((b) => (
                    <td key={b} className={d.belts[b] ? undefined : styles.vacant}>
                      {d.belts[b] ? d.belts[b].name : "Vacant"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ChampionModal champion={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
