import { useEffect, useState } from "react";
import styles from "./Hero.module.css";

export default function Hero({ pageKey }) {
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadHero() {
      try {
        const res = await fetch(`/api/hero?page=${pageKey}`);
        if (!res.ok) throw new Error("Hero fetch failed");
        const data = await res.json();
        if (!cancelled) setHero(data);
      } catch (err) {
        console.error("Failed to load hero content", err);
        if (!cancelled) setHero(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadHero();
    return () => { cancelled = true; };
  }, [pageKey]);

  if (loading) return <div className={styles.heroSkeleton} />;
  if (!hero) return null;

  return (
    <section
      className={styles.hero}
      style={hero.image_url ? { backgroundImage: `url(${hero.image_url})` } : undefined}
    >
      <div className={styles.heroOverlay} />
      <div className={styles.heroContent}>
        <h1>{hero.title}</h1>
        {hero.subtitle && <p className={styles.heroSubtitle}>{hero.subtitle}</p>}
        {hero.cta_label && hero.cta_link && (
          <a href={hero.cta_link} className={styles.heroCta}>{hero.cta_label}</a>
        )}
      </div>
    </section>
  );
}
