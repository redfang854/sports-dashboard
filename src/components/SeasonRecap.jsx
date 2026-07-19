import { useEffect, useState } from "react";
import styles from "./SeasonRecap.module.css";

export default function SeasonRecap({ pageKey }) {
  const [recap, setRecap] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRecap() {
      try {
        const res = await fetch(`/api/page-content?page=${pageKey}&section=season_recap`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setRecap(data.content);
      } catch (err) {
        console.error("Failed to load season recap", err);
      }
    }
    loadRecap();
    return () => { cancelled = true; };
  }, [pageKey]);

  if (!recap) return null;

  return (
    <div className={styles.recapBlock}>
      <span className={styles.recapLabel}>Season Recap</span>
      <p>{recap}</p>
    </div>
  );
}
