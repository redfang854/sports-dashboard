# Setup & deployment

## Prerequisites

- **Node.js 22.22 or newer** and npm. The repo's `.nvmrc` pins 22, so with nvm just run `nvm use` (CI reads the same file). Node 20 won't work: jsdom and Vitest require 22.
- A Vercel account (the project deploys there and `vercel dev` runs the API locally)
- Accounts and keys for the services you want live (all have free plans): football-data.org, API-Football, CitoAPI, Neon, Upstash Redis

## Environment variables

Secrets are set in **Vercel → Project → Settings → Environment Variables** (type *Secret*) and, for local work, in `.env.local`. All `.env*` files are git-ignored, and CI fails if one is ever committed.

### Server-only (read in `api/`, never sent to the browser)

| Variable | Used by | Without it |
|---|---|---|
| `FOOTBALL_API_KEY` | `/api/standings`, `/api/teams` | live football tables fail; table falls back to last season |
| `API_SPORTS_KEY` | `/api/apisports`, `/api/player-photo` (`APISPORTS_KEY` accepted as a fallback name) | squads show without photos |
| `CITO_API_KEY` | `/api/citoapi` | UFC panels fall back / show errors |
| `POSTGRES_URL_NON_POOLING` | `/api/f1-driver` (Neon) | F1 driver career stats fail |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | `_rateLimit.js` | rate limiting is skipped (fails open) |

### Public (prefixed `VITE_`)

None. The site needs no public keys. Anything prefixed `VITE_` is compiled into the JavaScript bundle and visible to every visitor, so never put a secret in one. `tests/feature/security/secrets.test.js` fails if browser code reads a custom `VITE_` variable, and CI scans the built bundle for secret-shaped strings.

**Remove these from Vercel** if they are still set (they belonged to the removed admin login): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`.

## Run locally

```bash
git clone https://github.com/redfang854/sports-dashboard.git
cd sports-dashboard
npm ci
```

**Frontend only** (fast; `/api/*` calls fail, so live panels show errors or fallbacks):

```bash
npm run dev            # http://localhost:5173
```

**Frontend + serverless functions** (recommended):

```bash
npm i -g vercel
vercel link            # once: connect to the Vercel project
vercel env pull .env.local
vercel dev             # http://localhost:3000, runs api/*.js too
```

Other scripts:

| Command | Does |
|---|---|
| `npm test` / `npm run test:watch` | Vitest suites ([Testing](testing.md)) |
| `npm run lint` | ESLint, whole project (also enforced in CI) |
| `npm run build` / `npm run preview` | production build in `dist/` / serve it |
| `npm run update:snapshots` | refresh WRC, boxing and rugby data from Wikipedia ([Maintenance](maintenance.md)) |

## Deploy

Vercel builds every push to `main` (`npm run build` → `dist/`) and deploys the functions in `api/`. `vercel.json` sends `/api/*` to the functions and every other path to `index.html`, so deep links such as `/boxing` load directly.

1. Push to `main`. GitHub Actions runs lint, tests, build and the bundle secret scan ([Testing](testing.md#ci-pipeline)), and Vercel deploys in parallel.
2. Check the deployment in Vercel → Deployments (build log, then Ready).
3. Smoke-test the live site: switch tabs, reload on a tab, open `/about`.

Environment variable changes only apply to **new** deployments. After editing one, redeploy (push, or Deployments → ⋯ → Redeploy).

## Data services

| Service | Holds | Setup notes |
|---|---|---|
| Neon Postgres | `f1_races`, `f1_results` (history) | F1 history loaded with `scripts/import-f1*.py`. The old CMS tables `hero_sections` and `page_content` are unused and can be dropped. |
| Upstash Redis | rate-limit counters (`ratelimit:<route>:<ip>`) | REST URL + token only |
