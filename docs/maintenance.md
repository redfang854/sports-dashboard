# Maintenance

Routine jobs and fixes for common failures, each as a runbook.

## Refresh the snapshot data (WRC, boxing, rugby)

**When:** about monthly, after a WRC rally or Six Nations round, or when the site shows "May be out of date" (60 days after the last update).

```bash
npm run update:snapshots -- --dry-run   # preview: prints before/after, writes nothing
npm run update:snapshots                # all three (or --only=wrc,rugby)
npm test                                # data-integrity tests check the new JSON
git add src/data/snapshots && git commit -m "Update snapshots" && git push
```

**How it works:** `scripts/update-snapshots.mjs` downloads Wikipedia's page HTML (REST API, identified with a User-Agent as Wikimedia asks), parses it with `scripts/snapshots/parsers.mjs` (columns found by header name), adds colours/flags in `build.mjs`, **validates**, and only then rewrites `src/data/snapshots/<sport>.json`. Season pages are chosen from today's date: Six Nations from February, club seasons from August, WRC by calendar year.

**If it prints `✗ … NOT written`:** a validation rule failed. Usually Wikipedia changed a table, or a new season's page isn't filled in yet. The old file is untouched. Re-run later, or fix the parser and add a fixture case to `tests/unit/scripts/snapshots.test.js`.

**New faces:** an unknown country shows without a flag (add it to `FLAGS` in `build.mjs`). An unknown rugby team gets a neutral colour (`TEAM_COLOR`). A new WRC manufacturer needs a line in `MAKE`.

## Rotate an API key

1. Generate a new key at the provider: football-data.org → Account; API-Football → dashboard.api-football.com → Account → My Access → **Reset my API-KEY**; Neon, Upstash and Supabase in their dashboards.
2. Vercel → Settings → Environment Variables → edit the variable (type Secret) → Save.
3. Redeploy (Deployments → ⋯ → Redeploy). Variables only apply to new deployments.
4. Check the related panel works, and that the old key is rejected.

## Common failures

| Symptom | Likely cause | Fix |
|---|---|---|
| Football shows "Live table unavailable" / "Rate limited" | football-data.org free plan: 10 requests/min | Usually clears within a minute. The CDN cache (10 min) keeps this rare. |
| `Missing application key` from `/api/apisports` | `API_SPORTS_KEY` wrong or from RapidAPI | Use the key from dashboard.api-football.com and redeploy |
| `Free plans do not have access to this season` | API-Football free plan covers 2022–2024 | Expected. Squads still work; only season-filtered calls fail. |
| Squad shows without photos | club not confidently matched, or API-Football daily quota (100) used | Add an alias in `src/api/teamMatch.js` if a club never matches; otherwise wait for the quota reset |
| Admin sign-in hangs or fails | Supabase project paused after ~7 days idle | Supabase dashboard → Restore project. Public pages are unaffected. |
| Sports Recents "unavailable" | the RSS feed is down or changed | Check the feed URL in `api/news.js` (`FEEDS`) |
| "May be out of date" on WRC / boxing / rugby | snapshot older than 60 days | [Refresh the snapshot data](#refresh-the-snapshot-data-wrc-boxing-rugby) |
| CI fails on `secrets.test.js` | a key, `VITE_` secret, unguarded proxy, wildcard CORS or leaked error message was added | Read the failing assertion; it names the file |

## Known issues

- **The admin CMS has no public effect.** It edits hero, season-recap and story content (`hero_sections`, `page_content`), but the components that displayed it (`Hero`, `SeasonRecap`, `StoryView`) are no longer rendered. Either repurpose the CMS (e.g. editorial notes per sport) or remove it along with the admin login, Supabase and those routes.
- **Tabs lack full keyboard semantics.** They have `role="tab"` and `aria-selected`, but no arrow-key navigation or `tabpanel`.
- **API-Football free plan** limits the team-list season to 2024–25 and 100 requests/day.
- Legacy files `src/components/Hero.jsx`, `SeasonRecap.jsx`, `src/views/StoryView.jsx` and `AppRouter.jsx`'s story comment remain for the CMS decision above.
