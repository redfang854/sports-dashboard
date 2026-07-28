import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiters = {};

function getLimiter(name, requests, window) {
  if (!redis) return null;
  if (!limiters[name]) {
    limiters[name] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `ratelimit:${name}`,
      analytics: true,
    });
  }
  return limiters[name];
}

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Checks and enforces a per-IP rate limit for a given endpoint name.
 * If Upstash env vars are not configured, this fails open (returns true)
 * so the app keeps working before UPSTASH_REDIS_REST_URL / TOKEN are set.
 *
 * Usage:
 *   const allowed = await checkRateLimit(req, res, "apisports", { requests: 30, window: "60 s" });
 *   if (!allowed) return;
 */
export async function checkRateLimit(req, res, name, { requests = 30, window = "60 s" } = {}) {
  const limiter = getLimiter(name, requests, window);
  if (!limiter) return true;

  const ip = getClientIp(req);
  const { success, limit, remaining, reset } = await limiter.limit(`${name}:${ip}`);

  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", reset);

  if (!success) {
    res.status(429).json({ error: "Too many requests. Please slow down." });
    return false;
  }
  return true;
}
