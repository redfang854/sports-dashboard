# Setup & deployment

## Prerequisites

- Node.js 22 (CI uses 22) and npm
- A Vercel account (the project deploys there and `vercel dev` runs the API locally)
- Accounts and keys for the services you want live (all have free plans): football-data.org, API-Football, CitoAPI, Neon, Upstash Redis, Supabase

## Environment variables

Secrets are set in **Vercel → Project → Settings → Environment Variables** (type *Secret*) and, for local work, in `.env.local`. All `.env*` files are git-ignored, and CI fails if one is ever committed.

### Server-only (read in `api/`, never sent to the browser)

| Variable | Used by | Without it |
|---|---|---|
| `FOOTBALL_API_KEY` | `/api/standings`, `/api/teams` | live football tables fail; table falls back to last season |
| `API_SPORTS_KEY` | `/api/apisports`, `/api/player-photo` (`APISPORTS_KEY` accepted as a fallback name) | squads show without photos |
| `CITO_API_KEY` | `/api/citoapi` | UFC panels fall back / show errors |
| `POSTGRES_URL_NON_POOLING` | `/api/f1-driver`, `/api/hero`, `/api/page-content` (Neon) | F1 driver career stats and CMS fail |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | `_rateLimit.js` | rate limiting is skipped (fails open) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `_supabaseAdmin.js` (verify admin tokens, storage uploads) | every admin write is refused |
| `ADMIN_EMAIL` | `_supabaseAdmin.js` | every admin write is refused (fails closed) |

### Public (prefixed `VITE_`, compiled into the JavaScript bundle)

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | browser Supabase client for admin sign-in. The anon key is designed to be public. |
| `VITE_ADMIN_EMAIL` | which signed-in user sees the Admin tab (cosmetic; the server enforces `ADMIN_EMAIL`) |

> Anything prefixed `VITE_` is visible to every visitor. Never put a secret in one. `tests/feature/security/secrets.test.js` only allows these three in browser code, and CI scans the built bundle for secret-shaped strings.

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
| Neon Postgres | `f1_races`, `f1_results` (history), `hero_sections`, `page_content` (CMS) | F1 history loaded with `scripts/import-f1*.py` |
| Upstash Redis | rate-limit counters (`ratelimit:<route>:<ip>`) | REST URL + token only |
| Supabase | the admin user; storage for CMS images | Sign-ups **disabled**; only the admin account exists. Free projects pause after ~7 days idle: restore from the dashboard. Only admin sign-in depends on it. |
