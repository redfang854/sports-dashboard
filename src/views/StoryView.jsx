import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./StoryView.module.css";

const SPORT_LABELS = {
  football: "Football", f1: "Formula 1", mma: "MMA",
  boxing: "Boxing", rugby: "Rugby", wrc: "WRC",
};

const SPORT_KEYS = Object.keys(SPORT_LABELS);

async function fetchSection(page, section) {
  const res = await fetch(`/api/page-content?page=${page}&section=${section}`);
  if (!res.ok) return "";
  const data = await res.json();
  return data.content || "";
}

function computeReadTime(body) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function todayFormatted() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function extractPullQuote(paragraphs) {
  for (const p of paragraphs) {
    const match = p.match(/"([^"]{15,140})"/);
    if (match) return { quote: match[1], sourceParagraph: p };
  }
  return null;
}

export default function StoryView() {
  const { sport } = useParams();
  const [story, setStory] = useState(null);
  const [related, setRelated] = useState([]);
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

      const otherKeys = SPORT_KEYS.filter((k) => k !== sport);
      const otherTitles = await Promise.all(
        otherKeys.map((k) => fetchSection(k, "story_title"))
      );
      const relatedList = otherKeys
        .map((k, i) => ({ key: k, label: SPORT_LABELS[k], title: otherTitles[i] }))
        .filter((r) => r.title);

      if (!cancelled) {
        setStory({ title, body, image });
        setRelated(relatedList);
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
        <a href={backHref} className={styles.backLink}>&larr; {sportLabel}</a>
        <div className={styles.card}>
          <p className={styles.eventLabel}>No story yet for {sportLabel}</p>
        </div>
      </div>
    );
  }

  const paragraphs = story.body.split("\n").map((p) => p.trim()).filter(Boolean);
  const pullQuote = extractPullQuote(paragraphs);
  const readTime = computeReadTime(story.body);
  const publishedDate = todayFormatted();

  const midpoint = Math.ceil(paragraphs.length / 2);
  const firstHalf = paragraphs.slice(0, midpoint);
  const secondHalf = paragraphs.slice(midpoint);

  return (
    <div className={styles.page}>
      <a href={backHref} className={styles.backLink}>&larr; {sportLabel}</a>

      <article className={styles.card}>
        <header className={styles.cardHeader}>
          <p className={styles.eyebrow}>{sportLabel} &bull; Season Story</p>
          <h1 className={styles.title}>{story.title}</h1>
          <p className={styles.meta}>
            {publishedDate} &bull; {readTime} min read &bull; By APEX Sports
          </p>
        </header>

        {story.image && (
          <div className={styles.heroImageWrap}>
            <img src={story.image} alt={story.title} className={styles.heroImage} />
          </div>
        )}

        <div className={styles.content}>
          {firstHalf.map((p, i) => (
            <p key={`a-${i}`} className={styles.bodyText}>{p}</p>
          ))}

          {pullQuote && (
            <blockquote className={styles.pullQuote}>&ldquo;{pullQuote.quote}&rdquo;</blockquote>
          )}

          {secondHalf.map((p, i) => (
            <p key={`b-${i}`} className={styles.bodyText}>{p}</p>
          ))}
        </div>

        {related.length > 0 && (
          <div className={styles.relatedSection}>
            <div className={styles.divider} />
            <p className={styles.relatedHeading}>Related Stories</p>
            <div className={styles.relatedGrid}>
              {related.map((r) => (
                <a key={r.key} href={`/${r.key}/story`} className={styles.relatedItem}>
                  <span className={styles.relatedSport}>{r.label}</span>
                  <span className={styles.relatedTitle}>{r.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
