# APEX: multi-sport dashboard

Live standings, results and news for **football, Formula 1, MMA, boxing, rugby and WRC** in one fast interface.

**Live demo:** [sports-dashboard-peach-chi.vercel.app](https://sports-dashboard-peach-chi.vercel.app) · **Built by** [Brian Hinga](https://sudo-hinga.hingabayo.workers.dev) · [Detailed docs](docs/README.md)

![Tests](https://github.com/redfang854/sports-dashboard/actions/workflows/tests.yml/badge.svg)

## What it does

- **Every sport on its own page** (`/football`, `/f1`, `/mma`, `/boxing`, `/rugby`, `/wrc`), so reloads, bookmarks and shared links land on the right tab.
- **Sports Recents**: the latest headlines per sport from BBC Sport and Autosport.
- **Live data** where a free source exists: football tables, fixtures and squads; F1 standings, results and the race countdown; UFC events.
- **Snapshots** where none does: WRC season, world boxing champions, rugby tables. They are refreshed from Wikipedia by a script, dated on the page, and flagged when older than 60 days.
- **Responsive and readable**: WCAG AA text contrast, a consistent type scale, a compact mobile layout, and wider content on large screens.

## How it's built

```
Browser (React 19 + Vite SPA)
   │  /api/*                        │ direct (no key)
   ▼                                ▼
Vercel CDN → serverless functions   Jolpica F1, TheSportsDB
   │  key added server-side, allow-listed endpoints, per-IP rate limits
   ▼
football-data.org · API-Football · CitoAPI · RSS      Neon Postgres · Upstash Redis
```

Full diagram and request flows: [docs/architecture.md](docs/architecture.md).

| Area | Choices |
|---|---|
| Frontend | React 19, React Router, CSS Modules with design tokens, one lazily loaded chunk per sport (main bundle 77 KB gzipped) |
| Backend | Vercel serverless functions as locked-down proxies: keys never reach the browser, only an allow-list of endpoints is forwarded, responses are CDN-cached |
| Data | Neon Postgres (~79k F1 result rows), Upstash Redis (rate limiting), Wikipedia snapshots via `npm run update:snapshots` |
| Accounts | None by design: no sign-up, login or personal data, so there is nothing to breach |
| Quality | Vitest unit and feature tests, ESLint, and GitHub Actions running lint, tests, a secret-free build and a bundle secret scan on every push |

## Engineering highlights

- **Security:** found and closed open-relay proxies that let anyone spend the API quotas; removed wildcard CORS; removed an unused admin login and its auth library entirely; added CI guards against committed keys, secrets in the browser bundle, unguarded proxies and leaked error messages. See [docs/security.md](docs/security.md).
- **Free-tier engineering:** stays within a 10 requests/minute football API and a 100 requests/day squad API through edge caching, request sharing, one retry on 429, and a permanent club-id cache.
- **Honest data:** live views say "unavailable" rather than silently showing stale numbers. Snapshots show their date and source, and are validated before they are written.
- **Performance:** code-splitting and dropping the unused auth library took the main bundle from 431 KB to 240 KB (126 → 77 KB gzipped).

The reasoning behind each choice is in [docs/decisions.md](docs/decisions.md).

## Run it

```bash
npm ci
npm run dev          # frontend only, http://localhost:5173
vercel dev           # frontend + API functions (needs `vercel link` and env vars)
npm test             # offline test suite
npm run lint
```

Environment variables, deployment and data services: [docs/setup-and-deployment.md](docs/setup-and-deployment.md). Routine jobs (refreshing snapshots, rotating keys): [docs/maintenance.md](docs/maintenance.md).

## Data and credits

Formula 1 data from [Jolpica F1](https://github.com/jolpica/jolpica-f1); football from [football-data.org](https://www.football-data.org) and [API-Football](https://www.api-football.com); UFC from CitoAPI and TheSportsDB; headlines from BBC Sport and Autosport RSS, linking to the original articles. WRC, boxing and rugby tables are adapted from Wikipedia under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). World Cup photos are from Wikimedia Commons. Team, league and competition names are trademarks of their owners. APEX is an independent project and not affiliated with any of them. Full list on the site's [About page](https://sports-dashboard-peach-chi.vercel.app/about).
