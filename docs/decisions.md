# Decisions

Short records of choices that shape the code: the context, what was decided, and what it costs. Newest last.

### 1. Serverless proxies instead of calling APIs from the browser
**Context:** football-data.org, API-Football and CitoAPI need secret keys, and some block browser CORS. **Decision:** call them through Vercel functions that add the key server-side. **Trade-off:** an extra hop, and the proxies themselves had to be locked down (decision 2).

### 2. Allow-listed proxy endpoints, no wildcard CORS
**Context:** the original proxies forwarded any `?endpoint=` with our key and allowed any origin, so anyone could spend our quotas. **Decision:** accept only the endpoint shapes the site uses, plain query params only, same-origin only, and a CI test that fails if a proxy skips the guard. **Trade-off:** using a new upstream endpoint means updating `api/_endpointGuard.js` first.

### 3. No accounts at all
**Context:** accounts existed for a live chat (spam risk, password-reset upkeep, Realtime load) and for an admin CMS whose content was no longer shown on the site. **Decision:** remove chat, sign-up and sign-in first, then the admin area, its four API routes, the CMS components and the Supabase dependency. **Result:** no personal data, no credentials to protect, ~185 KB less JavaScript, four fewer routes. **Trade-off:** no community features and no in-browser content editing. Content that needs a human now comes from the snapshot script (decision 6).

### 4. Code-split the sport views
**Context:** the whole app shipped as one 557 KB file. **Decision:** load each sport's view with `React.lazy` the first time its tab opens. Together with decision 3, the main bundle went from 431 KB to 240 KB (126 → 77 KB gzipped). **Trade-off:** a brief loading state the first time a tab is opened.

### 5. URL per tab
**Context:** the tab lived in React state, so reloads always reset to Football. **Decision:** `/football`, `/f1`, … with the URL as the single source of truth. **Trade-off:** none significant. Old `#sport` links still work.

### 6. Snapshots for WRC, boxing and rugby
**Context:** there is no free, reliable live API for WRC or world boxing champions, and API-Football's free plan blocks current rugby seasons. Hand-written data had gone stale and contradicted itself (e.g. a "Grand Slam" next to a loss). **Decision:** take the data from Wikipedia (CC BY-SA 4.0, credited) with a script that parses by column name, validates, and refuses to write suspicious data. Show "Updated <date>", which turns into a warning after 60 days. **Trade-off:** someone has to run the script, roughly monthly.

### 7. Live data never falls back to stale data silently
**Context:** summary cards showed last season's leaders when the live API failed, contradicting the live table. **Decision:** live-derived UI says "unavailable" instead. The one fallback (last season's football table) is clearly labelled. **Trade-off:** occasional "unavailable" messages instead of plausible-looking wrong numbers.

### 8. Match clubs by search with a confidence threshold
**Context:** API-Football names differ from football-data.org's ("Hull City AFC" vs "Hull City"), and exact matching found almost nothing. **Decision:** cleaned-name search filtered by country and senior teams; below the threshold, show no photos rather than risk the wrong squad. Results cached per browser. **Trade-off:** a few clubs need an alias (Wolves).

### 9. Initials instead of photos for drivers and fighters
**Context:** the bundled driver photos and hot-linked fighter photos had unclear licences. **Decision:** team-coloured initials. **Trade-off:** less visual. Photos could return with properly licensed (e.g. Wikimedia Commons) images and credits.

### 10. RSS for news, cached at the edge
**Context:** no free news API covers all six sports. **Decision:** BBC Sport and Autosport RSS through `/api/news`, cached 15 minutes, linking to the publisher. **Trade-off:** headline and summary only, and the sources are English-language.

### 11. Tokens for colour, type and width
**Context:** around 100 low-contrast greys (down to 1.25:1) and 15 ad-hoc font sizes. **Decision:** `--text-faint` (≥5:1 on every surface), a 7-step type scale with an 11 px floor, and a `--container` width that grows on large screens. **Trade-off:** none. New CSS should use the tokens.
