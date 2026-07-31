import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./StoryView.module.css";

const SPORT_LABELS = {
  football: "Football", f1: "Formula 1", mma: "MMA",
  boxing: "Boxing", rugby: "Rugby", wrc: "WRC",
};

async function fetchSection(page, section) {
  const res = await fetch(`/api/page-content?page=${page}&section=${section}`);
  if (!res.ok) return "";
  const data = await res.json();
  return data.content || "";
}

export default function StoryView() {
  const { sport } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [title, body, image] = await Promise.all([
        fetchSection(sport, "story_title"),
        fetchSection(sport, "story_body"),
        fetchSection(sport, "story_image_url"),
      ]);
      if (!cancelled) {
        setStory({ title, body, image });
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [sport]);

  const sportLabel = SPORT_LABELS[sport] || sport;
  const backHref = `/#${sport}`;

  if (loading) return <div className={styles.page}><div className={styles.skeleton} /></div>;

  if (!story || !story.title) {
    return (
      <div className={styles.page}>
        <a href={backHref} className={styles.backBtn}>&larr; back to standings</a>
        <div className={styles.panel}>
          <p className={styles.eventLabel}>No story yet for {sportLabel}</p>
        </div>
      </div>
    );
  }

  const paragraphs = story.body.split("\n").map((p) => p.trim()).filter(Boolean);

  return (
    <div className={styles.page}>
      <div className={styles.heroBand}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{sportLabel} season story</p>
          <h1 className={styles.title}>{story.title}</h1>
          <a href={backHref} className={styles.backBtn}>&larr; back to standings</a>
        </div>
      </div>

      <div className={styles.panel}>
        <p className={styles.eventLabel}>2026 season story</p>

        {story.image && (
          <img src={story.image} alt={story.title} className={styles.featuredImage} />
        )}

        {paragraphs.map((p, i) => (
          <p key={i} className={styles.bodyText}>{p}</p>
        ))}

        <a href={backHref} className={styles.backBtnFooter}>&larr; back to standings</a>
      </div>
    </div>
  );
}
