# Testing & CI

Tests use **Vitest** with **Testing Library** (React) and **jsdom**. They are fully offline. Upstash, the RSS feeds and every sports API are mocked, so no keys, network or database are needed. Run them with:

```bash
npm test                         # everything, once
npm run test:watch               # re-run on change
npx vitest run tests/unit/api    # one folder
```

Config is in `vitest.config.js`, kept separate from `vite.config.js` so test settings never affect production builds. API and data tests run in Node; component tests opt into jsdom with `// @vitest-environment jsdom` at the top of the file. `tests/setup.js` loads jest-dom matchers and unmounts after each test. Mocks, stubbed globals and env vars are reset between tests.

## What is tested

**Unit tests** check one module in isolation:

| File | Covers |
|---|---|
| `unit/api/newsParser` | RSS parsing: CDATA, entities, HTML stripping, safe http(s) links only, newest-first, 6-item cap, duplicates, bad dates, junk input |
| `unit/api/endpointGuard` | proxy allow-lists: allowed endpoints pass; traversal, encoded paths, smuggled queries, foreign URLs, non-strings, bad params are rejected |
| `unit/api/teamMatch` | football-data → API-Football club matching, built from real search responses (Hull City, Inter, Bayern, PSG, Atlético, Wolves); rejects youth/women's sides, other countries, lookalikes |
| `unit/lib/timeAgo` | relative time buckets, invalid and future dates |
| `unit/hooks/useFetch` | loading → data, errors, refetch, refetch on new deps keeping old data, ignoring stale responses (race), no refetch when only the inline fetcher changes |
| `unit/components/SportsRecents` | loading/success/error/empty states, broken images, safe new-tab links, sport switching |
| `unit/components/UpdatedNote` | "Updated" line, stale warning after 60 days, invalid dates, UTC formatting |
| `unit/data/wrc · boxing · rugby` | **integrity of the snapshot JSON**: ordering, points, P = W + D + L, valid dates not after the snapshot date, winners present, one record per fighter; plus the derived helpers (round status, undisputed, title changes) |
| `unit/scripts/snapshots` | the update script's parsers and validators against fixtures reproducing the live Wikipedia structures |

**Feature tests** check how the parts work together:

| File | Covers |
|---|---|
| `feature/App.routing` | the whole shell: tab URLs and deep links, reload behaviour, intro once per session, page titles, `/about`, footer credits, **no login/admin/chat UI anywhere**, `/admin` falls back to Football |
| `feature/api/news` | `/api/news` end to end: all six feeds, 400/405/429, upstream failures → 502 not cached, no internal detail leaked |
| `feature/api/proxies` | `/api/teams`, `/api/apisports`, `/api/citoapi`, `/api/standings`: allowed calls forwarded once with the key to the right host; everything else rejected **before** any upstream call; no wildcard CORS |
| `feature/security/secrets` | static guards on the repo: no committed `.env`, no hard-coded keys/tokens/connection strings, browser code reads no custom `VITE_` vars, no auth library or sign-in/session code, service-role key only in `api/`, no route echoes env vars, every `?endpoint=` proxy uses the guard, no wildcard CORS, no raw error messages sent to clients |

## How the tests were checked

A passing test is only useful if it fails when the code breaks. The key tests were checked by **deliberately reintroducing the bug** and confirming the suite failed:

- `FEEDS[sport]` without an own-property check (accepted `?sport=constructor`)
- planting a hard-coded key in `src/`

## CI pipeline

`.github/workflows/tests.yml` runs on every push to `main` and every pull request, with read-only permissions and a 10-minute timeout:

1. `npm ci`
2. `npm run lint`: whole project, zero errors required
3. `npm test`
4. `npm run build` **with no environment variables**, so a build that only works with secrets present can't pass
5. **Bundle secret scan**: fails if `dist/` contains server-only variable names, Groq/Neon-style keys or a Postgres URL with a password

## Writing new tests

- Put pure logic in its own module and unit-test it (see `api/_newsParser.js`, `src/api/teamMatch.js`, `scripts/snapshots/parsers.mjs`).
- Mock at the boundary (`fetch`, `api/_rateLimit.js`), never the code under test.
- For every behaviour, assert the failure path too: what a user sees when the API is down, slow, empty or malicious.
- Start each file with a short header saying what it covers and what can go wrong, like the existing ones.
