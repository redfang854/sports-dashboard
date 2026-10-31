import styles from "./AboutView.module.css";

const GITHUB    = "https://github.com/redfang854/sports-dashboard";
const PROFILE   = "https://github.com/redfang854";
const PORTFOLIO = "https://sudo-hinga.hingabayo.workers.dev";
const CC_BY_SA  = "https://creativecommons.org/licenses/by-sa/4.0/";

const SOURCES = [
  { area: "Formula 1 standings, results, calendar", source: "Jolpica F1 API (Ergast-compatible)", href: "https://github.com/jolpica/jolpica-f1", live: true },
  { area: "Football standings, fixtures, teams", source: "football-data.org", href: "https://www.football-data.org", live: true },
  { area: "Football squads and player photos", source: "API-Football (API-Sports)", href: "https://www.api-football.com", live: true },
  { area: "UFC events and results", source: "CitoAPI and TheSportsDB", href: "https://www.thesportsdb.com", live: true },
  { area: "Sports Recents headlines", source: "BBC Sport and Autosport RSS feeds (headlines link to the original article)", href: "https://www.bbc.co.uk/sport", live: true },
  { area: "WRC, boxing champions, rugby tables", source: "Wikipedia, CC BY-SA 4.0 (snapshots, refreshed by script)", href: CC_BY_SA, live: false },
  { area: "World Cup player photos", source: "Wikimedia Commons (individual licences in the data files)", href: "https://commons.wikimedia.org", live: false },
];

const BUILT = [
  ["Frontend", "React 19 + Vite, React Router; one lazily loaded code chunk per sport"],
  ["Backend", "Vercel serverless functions that keep API keys server-side and only forward an allow-list of endpoints"],
  ["Data", "Neon Postgres for F1 history (~79k records); Upstash Redis for per-IP rate limiting; CDN caching of upstream feeds"],
  ["Accounts", "None by design: no sign-up, login or user data to protect"],
  ["Quality", "Vitest unit and feature tests, ESLint, and a secret scan of the built bundle, run by GitHub Actions on every push"],
];

// /about: who built the site, how, and where every piece of data comes from.
export default function AboutView() {
  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.kicker}>About this project</p>
        <h1 className={styles.title}>APEX is a multi-sport dashboard built by Brian Hinga.</h1>
        <p className={styles.lead}>
          Live standings, results and news across football, Formula 1, MMA, boxing, rugby and WRC, in one fast
          interface. It's a portfolio project focused on doing the unglamorous parts properly:
          protecting API keys, staying inside free-tier limits, testing, and being honest about where data comes from.
        </p>
        <p className={styles.links}>
          <a href={PORTFOLIO} target="_blank" rel="noopener noreferrer">Portfolio</a>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer">Source code</a>
          <a href={PROFILE} target="_blank" rel="noopener noreferrer">GitHub profile</a>
        </p>
      </header>

      <section className={styles.section} aria-labelledby="built">
        <h2 id="built" className={styles.h2}>How it's built</h2>
        <dl className={styles.list}>
          {BUILT.map(([k, v]) => (
            <div key={k} className={styles.row}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="sources">
        <h2 id="sources" className={styles.h2}>Data sources and credits</h2>
        <table className={styles.table}>
          <thead><tr><th scope="col">Data</th><th scope="col">Source</th><th scope="col">Type</th></tr></thead>
          <tbody>
            {SOURCES.map((s) => (
              <tr key={s.area}>
                <td>{s.area}</td>
                <td><a href={s.href} target="_blank" rel="noopener noreferrer">{s.source}</a></td>
                <td>{s.live ? "Live" : "Snapshot"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.note}>
          Text and tables adapted from Wikipedia are available under the{" "}
          <a href={CC_BY_SA} target="_blank" rel="noopener noreferrer">Creative Commons Attribution-ShareAlike 4.0</a>{" "}
          licence. Snapshot sections show the date they were last updated. Team, league and competition names are
          trademarks of their owners; APEX is an independent project and is not affiliated with any of them.
        </p>
      </section>
    </article>
  );
}
