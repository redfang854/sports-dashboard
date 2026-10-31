/**
 * FEATURE (static guard) — API keys and secrets stay out of the repo and the browser
 *
 * Scans the tracked source tree. No network, no database. Fails if:
 *   1. any .env file is tracked by git, or .gitignore stops ignoring env files
 *   2. a key/token/connection string is hard-coded in src/, api/ or scripts/
 *      (this repo's history already had two football-data.org keys committed)
 *   3. browser code (src/) reads anything except the allow-listed public VITE_
 *      variables. Vite copies every VITE_ variable into the public JS bundle,
 *      so a secret given a VITE_ prefix would be published to every visitor.
 *   4. browser code references process.env or a server-only variable name
 *   5. the Supabase service-role key is used outside api/ (it bypasses RLS)
 *   6. an API route echoes an environment variable back in a response
 *
 * Goes right: secrets live only in Vercel env vars / .env.local and are read
 * server-side in api/. Goes wrong: someone pastes a key "temporarily", prefixes a
 * secret with VITE_, or returns process.env in a debug response.
 */
import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "../../..");

// Public by design: the Supabase anon key is meant for browsers (RLS protects
// data) and the admin email is not a credential.
const ALLOWED_CLIENT_ENV = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_ADMIN_EMAIL", "MODE", "DEV", "PROD", "BASE_URL", "SSR"];

const SERVER_ONLY_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY", "POSTGRES_URL", "POSTGRES_PASSWORD", "PGPASSWORD", "DATABASE_URL",
  "UPSTASH_REDIS_REST_TOKEN", "GROQ_API_KEY", "FOOTBALL_API_KEY", "APISPORTS_KEY", "API_SPORTS_KEY",
  "CITO_API_KEY", "VERCEL_OIDC_TOKEN",
];

const SECRET_PATTERNS = [
  ["JWT (e.g. Supabase service-role key)", /eyJhbGciOi[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/],
  ["Groq API key", /gsk_[A-Za-z0-9]{20,}/],
  ["OpenAI-style key", /\bsk-[A-Za-z0-9_-]{20,}/],
  ["Postgres URL with password", /postgres(?:ql)?:\/\/[^\s:"'`/]+:[^\s@"'`$]+@/],
  ["Neon password", /\bnpg_[A-Za-z0-9]{8,}/],
  ["Upstash token", /\bA[A-Za-z0-9]{2}[A-Za-z0-9]{30,}=/],
  ["hard-coded API header value", /(?:x-apisports-key|X-Auth-Token|x-rapidapi-key|Authorization)["']?\s*[:=]\s*["'`](?:Bearer\s+)?[A-Za-z0-9]{20,}["'`]/i],
  ["generic secret assignment", /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'`][A-Za-z0-9_-]{24,}["'`]/i],
];

function tracked(...prefixes) {
  const out = execSync(`git ls-files -- ${prefixes.join(" ")}`, { cwd: ROOT, encoding: "utf8" });
  return out.split("\n").filter((f) => f && /\.(m?js|jsx|ts|tsx|py|json|html)$/.test(f) && !f.includes("package-lock"));
}
const read = (f) => readFileSync(join(ROOT, f), "utf8");
const isGitRepo = existsSync(join(ROOT, ".git"));

describe.skipIf(!isGitRepo)("secrets: repository hygiene", () => {
  it("tracks no .env files", () => {
    const files = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" }).split("\n");
    expect(files.filter((f) => /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith(".example"))).toEqual([]);
  });

  it(".gitignore ignores .env and .env.local files", () => {
    for (const f of [".env", ".env.local", ".env.production.local"]) {
      const res = execSync(`git check-ignore -q ${f} && echo ignored || echo NOT`, { cwd: ROOT, encoding: "utf8" }).trim();
      expect(res, `${f} must be git-ignored`).toBe("ignored");
    }
  });

  it("contains no hard-coded keys, tokens or connection strings", () => {
    const hits = [];
    for (const f of tracked("src", "api", "scripts", "index.html", "vercel.json", "vite.config.js")) {
      const text = read(f);
      for (const [label, re] of SECRET_PATTERNS) {
        const m = text.match(re);
        if (m) hits.push(`${f}: ${label} (${m[0].slice(0, 12)}...)`);
      }
    }
    expect(hits).toEqual([]);
  });
});

describe.skipIf(!isGitRepo)("secrets: browser code only uses public variables", () => {
  const clientFiles = () => tracked("src").map((f) => [f, read(f)]);

  it("reads only allow-listed import.meta.env variables", () => {
    const bad = [];
    for (const [f, text] of clientFiles()) {
      for (const [, name] of text.matchAll(/import\.meta\.env\.([A-Z0-9_]+)/g)) {
        if (!ALLOWED_CLIENT_ENV.includes(name)) bad.push(`${f}: ${name}`);
      }
    }
    expect(bad, "New VITE_ variables are PUBLIC. Add to the allow-list only if it is safe for every visitor to see.").toEqual([]);
  });

  it("never touches process.env or server-only variable names", () => {
    const bad = [];
    for (const [f, text] of clientFiles()) {
      if (/process\.env/.test(text)) bad.push(`${f}: process.env`);
      for (const name of SERVER_ONLY_NAMES) if (text.includes(name)) bad.push(`${f}: ${name}`);
    }
    expect(bad).toEqual([]);
  });

  it("uses the service-role key only inside api/", () => {
    const outside = tracked("src", "scripts", "index.html")
      .filter((f) => read(f).includes("SERVICE_ROLE"));
    expect(outside).toEqual([]);
  });
});

describe.skipIf(!isGitRepo)("secrets: API routes", () => {
  it("never send environment variables back in a response", () => {
    const bad = tracked("api").filter((f) =>
      /res\.(?:status\([^)]*\)\.)?(?:json|send)\([^;]*process\.env/.test(read(f).replace(/\s+/g, " "))
    );
    expect(bad).toEqual([]);
  });
});

describe.skipIf(!isGitRepo)("secrets: key-bearing proxies stay locked down", () => {
  const routes = () => tracked("api").filter((f) => /^api\/[^_][^/]*\.js$/.test(f));

  it("no API route allows every origin (Access-Control-Allow-Origin: *)", () => {
    expect(routes().filter((f) => /Access-Control-Allow-Origin["'`]\s*,\s*["'`]\*/.test(read(f)))).toEqual([]);
  });

  it("every route that forwards a caller-supplied endpoint uses the allow-list guard", () => {
    const unguarded = routes().filter((f) => {
      const src = read(f);
      return /req\.query/.test(src) && /\bendpoint\b/.test(src) && !/isAllowedEndpoint\(/.test(src);
    });
    expect(unguarded, "Route forwards ?endpoint= without isAllowedEndpoint() from api/_endpointGuard.js").toEqual([]);
  });
});
