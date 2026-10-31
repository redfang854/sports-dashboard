// Allow-lists for the API proxy routes. Each proxy attaches a secret key
// to the upstream request, so forwarding arbitrary paths would let anyone
// on the internet spend the quota (or probe endpoints) with our key.
// Only the endpoint shapes the site actually calls are accepted.

const SAFE = /^[A-Za-z0-9][A-Za-z0-9/_-]*$/; // no dots, query, fragments or encoding

export function isAllowedEndpoint(endpoint, patterns) {
  if (typeof endpoint !== "string" || endpoint.length > 120) return false;
  if (!SAFE.test(endpoint) || endpoint.includes("//")) return false;
  return patterns.some((re) => re.test(endpoint));
}

// Query params forwarded upstream: plain scalar values only, limited count.
export function safeParams(rest, max = 10) {
  const params = new URLSearchParams();
  const entries = Object.entries(rest || {});
  if (entries.length > max) return null;
  for (const [k, v] of entries) {
    if (typeof v !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(k) || v.length > 100) return null;
    params.append(k, v);
  }
  return params;
}

export const FOOTBALL_DATA_ENDPOINTS = [
  /^competitions\/\d{4}\/(matches|teams)$/,
  /^teams\/\d{1,7}(\/matches)?$/,
  /^matches$/,
];

export const API_FOOTBALL_ENDPOINTS = [
  /^fixtures$/, /^fixtures\/headtohead$/, /^players$/, /^players\/squads$/, /^teams$/,
];

export const CITO_ENDPOINTS = [
  /^ufc\/events\/(recent|upcoming)$/,
  /^ufc\/events\/[A-Za-z0-9_-]{1,80}\/bouts$/,
];

export const STANDINGS_COMPETITIONS = ["PL", "PD", "SA", "BL1", "FL1", "CL"];
