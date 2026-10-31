# Security

APEX has **no user accounts and no login** (deliberately; see [decisions](decisions.md#3-no-accounts-at-all)) and stores no visitor data. What it has to protect is **API keys and quotas** and **visitors' browsers** (from anything malicious in third-party data).

## Threats and controls

| Threat | Control | Where | Enforced by |
|---|---|---|---|
| API keys exposed in the browser | Keys are read only in serverless functions; browser code uses no custom `VITE_` variables at all | `api/*`, `src/` | `secrets.test.js` + bundle scan in CI |
| Keys committed to git | `.env*` git-ignored; static scan for key/token/connection-string patterns | repo | `secrets.test.js` |
| **Open relay**: strangers spending our quotas through our proxies | Each proxy forwards only an allow-list of endpoint shapes and plain query params; `standings` only listed competitions | `api/_endpointGuard.js` | `endpointGuard`, `proxies` tests; `secrets.test.js` fails if a proxy skips the guard |
| Other websites calling our API from their visitors' browsers | No `Access-Control-Allow-Origin: *` on any route | `api/*` | `proxies` test + `secrets.test.js` |
| Abuse / scraping / quota exhaustion | Per-IP rate limits (Upstash), CDN caching so upstreams see few requests | `api/_rateLimit.js`, `Cache-Control` | `news` test |
| Key sent to an attacker's server via a URL parameter | `player-photo` only fetches `https://media.api-sports.io/…` (host fixed by prefix incl. trailing slash) | `api/player-photo.js` | code review |
| Account takeover, credential leaks | There are no accounts: no sign-up, sign-in, sessions or auth library | `src/`, `package.json` | `secrets.test.js` fails if an auth library or sign-in/session code is added |
| Malicious content in RSS feeds (e.g. `javascript:` links) | Only http(s) URLs pass for links and images; HTML stripped from text; React escapes output | `api/_newsParser.js` | `newsParser` tests |
| Prototype tricks in parameters (`?sport=constructor`) | Own-property lookups on frozen maps | `api/news.js` | `news` test |
| Oversized upstream responses | 2 MB cap and 8 s timeout on feed fetches | `api/news.js` | `news` test |
| Internal details leaking in errors | Errors logged server-side; clients get generic messages | all routes | `secrets.test.js` |
| New tabs controlling the opener | External links use `rel="noopener noreferrer"` | components | `SportsRecents` test |

## Supply chain and CI

- Dependencies are installed with `npm ci` from the lockfile.
- The CI workflow has `contents: read` permissions only and uses no secrets.
- The build runs without environment variables, and its output is scanned for secret-shaped strings.

## Known history

Two football-data.org keys were committed in early commits (`319075f`, `32421e0`) before keys moved to environment variables. The account's token was reset on 31 Oct 2026, so those values no longer work. Rewriting public history would not make them secret again, so the history is left as is and the static scan prevents a repeat.

## If a key leaks

Follow [Maintenance → Rotate an API key](maintenance.md#rotate-an-api-key): revoke it at the provider, set the new value in Vercel, redeploy, and confirm the old key fails.
