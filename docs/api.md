# API reference

All endpoints are Vercel serverless functions in `api/`. Files starting with `_` are shared modules, not routes. Every route:

- is **rate-limited per IP** through Upstash Redis (`api/_rateLimit.js`). Over the limit it returns `429 {"error":"Too many requests. Please slow down."}` with `X-RateLimit-Limit/Remaining/Reset` headers. If Upstash isn't configured the limiter is skipped (fails open), so local development works without Redis.
- returns **JSON errors** as `{"error": "<message>"}`. On unexpected failures the detail goes to the server log and the client gets a generic message.
- sends **no CORS headers**. Only the site itself (same origin) can call these routes from a browser.

## Public data

### `GET /api/news?sport=<sport>`
Latest headlines for one sport, from RSS.

| | |
|---|---|
| `sport` | `football` · `f1` · `mma` · `boxing` · `rugby` (BBC Sport) · `wrc` (Autosport) |
| 200 | `{ sport, items: [{ title, summary, url, image, publishedAt, source }] }` with up to 6 items, newest first. `url`/`image` are http(s) or `null`. |
| 400 | unknown sport (including prototype keys such as `constructor`, or a repeated `sport`) |
| 405 | method other than GET |
| 502 | feed unreachable, non-2xx, timed out (8 s) or larger than 2 MB. `{"error":"News feed unavailable","items":[]}`, never cached |
| Limit / cache | 30/min · CDN 15 min + 1 h stale |

### `GET /api/standings?comp=<code>`
League table from football-data.org.

| | |
|---|---|
| `comp` | `PL` · `PD` · `SA` · `BL1` · `FL1` · `CL` (anything else → 400) |
| 200 | football-data.org's `/competitions/{comp}/standings` body. `CL` returns `{"static": true}` (the site uses its own Champions League panel). |
| 403 / 404 / other | passed through from upstream with a short message |
| Limit / cache | 60/min · CDN 10 min + 1 h stale. Upstream allows 10 requests/min on the free plan, hence the long cache. |

### `GET /api/teams?endpoint=<path>&…`
Proxy to football-data.org v4 with the server's key.

| Allowed `endpoint` | Used for |
|---|---|
| `competitions/<id>/teams` | team list for a league (current season) |
| `competitions/<id>/matches` | fixtures |
| `teams/<id>` | squad fallback (no photos) |
| `teams/<id>/matches` | a team's recent results |
| `matches` | head-to-head lookups |

Extra query params are forwarded only if they are single plain values (max 10, keys `[A-Za-z0-9_-]`, values ≤100 chars). Otherwise → 400. Limit 60/min · CDN 60 min.

### `GET /api/apisports?endpoint=<path>&…`
Proxy to API-Football v3 (`x-apisports-key`).

Allowed `endpoint`: `teams` · `players` · `players/squads` · `fixtures` · `fixtures/headtohead`. The site uses `teams?search=` (club matching) and `players/squads?team=`. API-level errors (e.g. "Free plans do not have access to this season") come back as `400 {"error": …}`. Limit 30/min · CDN 5 min. The **upstream quota is 100 requests/day**.

### `GET /api/citoapi?endpoint=<path>`
Proxy to CitoAPI (UFC). Allowed: `ufc/events/recent`, `ufc/events/upcoming`, `ufc/events/<slug>/bouts`. Limit 30/min · CDN 5 min.

### `GET /api/player-photo?url=<url>`
Streams a player photo. `url` must start with `https://media.api-sports.io/` (otherwise 400), so the server's key can only ever be sent to that host. Limit 200/min · browser cache 1 day.

### `GET /api/f1-driver?name=<driver name>`
Career statistics from the Neon F1 history tables (matched on surname).
200 → `{ found: false }` or `{ found: true, … career totals, championships, notable races }`. 500 → database unreachable (retry). Limit 10/min · CDN 60 min.

## Admin (require `Authorization: Bearer <Supabase access token>`)

Writes are accepted only if `verifyAdmin` (`api/_supabaseAdmin.js`) confirms the token with Supabase **and** the user's email equals `ADMIN_EMAIL`. It fails closed: no header, a bad or expired token, a different user, a user without an email, `ADMIN_EMAIL` unset, or Supabase unreachable all give `403 {"error":"Forbidden"}`.

| Route | Methods | Body (POST) | Notes |
|---|---|---|---|
| `/api/hero?page=<key>` | GET public, POST admin | `{ page_key, title, subtitle?, image_url?, cta_label?, cta_link? }` | table `hero_sections` |
| `/api/page-content?page=<key>&section=<key>` | GET public, POST admin | `{ page_key, section_key, content }` | table `page_content` |
| `/api/upload-hero-image` | POST admin | `{ page_key, filename, content_type, data_base64 }` | image/*, ≤5 MB, Supabase Storage → `{ url, path }` |
| `/api/upload-story-image` | POST admin | same | same |

Limits: hero and page-content 60/min, uploads 20/min. These routes back the admin CMS, whose content isn't currently shown publicly ([Known issues](maintenance.md#known-issues)).

## Calling from the browser

Use the clients rather than raw `fetch`: `src/api/teams.js` (football-data + API-Football, club matching, squad fallback) and `src/api/index.js` (F1, UFC). `useFetch` (`src/hooks/useFetch.js`) gives `{ data, loading, error, refetch }`, ignores responses for stale arguments, and keeps the previous data visible while refetching.

## Adding a route safely

1. Validate every input against an allow-list. Never interpolate raw query values into an upstream URL (use `isAllowedEndpoint` / `safeParams` from `api/_endpointGuard.js`).
2. Call `checkRateLimit` with a sensible per-minute limit.
3. Read secrets from `process.env` only. Never prefix a secret with `VITE_` (that ships it to the browser).
4. Set `Cache-Control` on success, `no-store` on failure. Log errors server-side and return a generic message.
5. Add a feature test in `tests/feature/api/`. `tests/feature/security/secrets.test.js` will fail CI if the route forwards `?endpoint=` without the guard, allows every origin, or leaks error messages.
