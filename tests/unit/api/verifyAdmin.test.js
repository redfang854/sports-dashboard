/**
 * UNIT — api/_supabaseAdmin.js verifyAdmin() (server-side gate on every admin write)
 *
 * This is the real security boundary: hiding the Admin tab in the UI is only
 * cosmetic. Every admin API route (hero, page-content, uploads) trusts this.
 * Supabase is mocked, so no network, no real tokens, no database.
 *
 * Goes right: a valid bearer token for the ADMIN_EMAIL user returns that user.
 * Goes wrong (all must return null, never throw):
 *   - no / malformed Authorization header ("Basic", "bearer" lowercase, empty token)
 *   - token rejected by Supabase, or no user returned
 *   - a valid user who is not the admin (including different letter case)
 *   - ADMIN_EMAIL missing from the environment (must fail closed, even for a
 *     user without an email, where undefined === undefined would have matched)
 *   - Supabase unreachable/paused (getUser throws)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser } }),
}));

import { verifyAdmin } from "../../../api/_supabaseAdmin.js";

const ADMIN = "admin@apex.test";
const req = (authorization) => ({ headers: authorization === undefined ? {} : { authorization } });

beforeEach(() => {
  getUser.mockReset();
  vi.stubEnv("ADMIN_EMAIL", ADMIN);
});

describe("verifyAdmin", () => {
  it("returns the user for a valid admin token", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", email: ADMIN } }, error: null });
    await expect(verifyAdmin(req("Bearer good-token"))).resolves.toEqual({ id: "u1", email: ADMIN });
    expect(getUser).toHaveBeenCalledWith("good-token");
  });

  it.each([
    ["no header", undefined],
    ["empty header", ""],
    ["Basic auth", "Basic dXNlcjpwYXNz"],
    ["lowercase scheme", "bearer good-token"],
    ["scheme only", "Bearer "],
  ])("returns null with %s and never calls Supabase", async (_, header) => {
    await expect(verifyAdmin(req(header))).resolves.toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("returns null when the request has no headers object at all", async () => {
    await expect(verifyAdmin({})).resolves.toBeNull();
  });

  it("returns null when Supabase rejects the token", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "invalid JWT" } });
    await expect(verifyAdmin(req("Bearer expired"))).resolves.toBeNull();
  });

  it("returns null when Supabase returns no user", async () => {
    getUser.mockResolvedValue({ data: null, error: null });
    await expect(verifyAdmin(req("Bearer t"))).resolves.toBeNull();
  });

  it("returns null for a valid user who is not the admin", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u2", email: "fan@example.com" } }, error: null });
    await expect(verifyAdmin(req("Bearer t"))).resolves.toBeNull();
  });

  it("is case-sensitive on the email (no lookalike accounts)", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u3", email: ADMIN.toUpperCase() } }, error: null });
    await expect(verifyAdmin(req("Bearer t"))).resolves.toBeNull();
  });

  it("fails closed when ADMIN_EMAIL is not configured", async () => {
    vi.stubEnv("ADMIN_EMAIL", "");
    getUser.mockResolvedValue({ data: { user: { id: "u4", email: undefined } }, error: null });
    await expect(verifyAdmin(req("Bearer t"))).resolves.toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("returns null for a user with no email even if one is configured", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u5", phone: "+254700000000" } }, error: null });
    await expect(verifyAdmin(req("Bearer t"))).resolves.toBeNull();
  });

  it("returns null instead of throwing when Supabase is unreachable", async () => {
    getUser.mockRejectedValue(new Error("fetch failed"));
    await expect(verifyAdmin(req("Bearer t"))).resolves.toBeNull();
  });
});
