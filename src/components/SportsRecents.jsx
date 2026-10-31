import { useEffect, useState } from "react";
import styles from "./SportsRecents.module.css";

function timeAgo(iso) {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// Latest headlines for one sport, served by /api/news (RSS, CDN-cached).
// The lead story gets an image and summary; the rest are compact links.
export default function SportsRecents({ sport }) {
  const [state, setState] = useState({ loading: true, items: [], error: false });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/news?sport=${sport}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.status))))
      .then((data) => { if (!cancelled) setState({ loading: false, items: data.items || [], error: false }); })
      .catch((err) => {
        console.error("Failed to load sports recents", err);
        if (!cancelled) setState({ loading: false, items: [], error: true });
      });
    return () => { cancelled = true; };
  }, [sport]);

  const { loading, items, error } = state;
  const [lead, ...rest] = items;

  return (
    <section className={styles.block} aria-label="Sports Recents">
      <div className={styles.headRow}>
        <span className={styles.label}>Sports Recents</span>
        {lead && <span className={styles.source}>via {lead.source}</span>}
      </div>

      {loading && <p className={styles.muted}>Loading latest news…</p>}
      {!loading && (error || !lead) && <p className={styles.muted}>Latest news is unavailable right now.</p>}

      {lead && (
        <a className={styles.lead} href={lead.url} target="_blank" rel="noopener noreferrer">
          {lead.image && <img className={styles.leadImg} src={lead.image} alt="" loading="lazy" />}
          <div className={styles.leadBody}>
            <h3 className={styles.leadTitle}>{lead.title}</h3>
            {lead.summary && <p className={styles.leadSummary}>{lead.summary}</p>}
            <span className={styles.time}>{timeAgo(lead.publishedAt)}</span>
          </div>
        </a>
      )}

      {rest.length > 0 && (
        <ul className={styles.list}>
          {rest.map((item) => (
            <li key={item.url}>
              <a className={styles.item} href={item.url} target="_blank" rel="noopener noreferrer">
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.time}>{timeAgo(item.publishedAt)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
