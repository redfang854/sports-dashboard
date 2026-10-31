// @vitest-environment jsdom
/**
 * UNIT — src/context/AuthContext.jsx (admin-only session state, lazy Supabase)
 *
 * The Supabase client is replaced with a fake; getSupabase() is spied on to
 * prove when the library is (and is not) loaded.
 *
 * Goes right: visitors never load Supabase; a saved admin session is
 * restored; sign-in loads it on demand; auth events update the user.
 * Goes wrong (asserted): Supabase not configured (no crash, nobody), sign-in
 * errors propagate, signOut() hanging on the supabase-js lock bug (force
 * clear after 3s), listener unsubscribed on unmount.
 * Regression guard: removed public features (sign-up, Google, reset,
 * profiles) stay out of the context API.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const fake = vi.hoisted(() => {
  const state = { ready: true, stored: false, session: null, listener: null };
  const auth = {
    getSession: vi.fn(async () => ({ data: { session: state.session } })),
    onAuthStateChange: vi.fn((cb) => { state.listener = cb; return { data: { subscription: { unsubscribe: auth.unsubscribe } } }; }),
    unsubscribe: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(async () => ({ error: null })),
  };
  const getSupabase = vi.fn(async () => (state.ready ? { auth } : null));
  return { state, auth, getSupabase };
});

vi.mock("../../../src/lib/supabase", () => ({
  get supabaseReady() { return fake.state.ready; },
  getSupabase: fake.getSupabase,
  hasStoredSession: () => fake.state.stored,
}));

import { AuthProvider, useAuth } from "../../../src/context/AuthContext.jsx";

let ctx;
function Probe() {
  // Test probe: hands the live context value to the test body.
  // eslint-disable-next-line react-hooks/globals
  ctx = useAuth();
  return <span data-testid="who">{ctx.loading ? "loading" : ctx.user?.email ?? "nobody"}</span>;
}
const mount = () => render(<AuthProvider><Probe /></AuthProvider>);

beforeEach(() => {
  Object.assign(fake.state, { ready: true, stored: false, session: null, listener: null });
  Object.values(fake.auth).forEach((f) => f.mockClear?.());
  fake.getSupabase.mockClear();
});
afterEach(() => vi.useRealTimers());

describe("AuthContext", () => {
  it("exposes only the admin-auth API (removed features stay removed)", () => {
    mount();
    expect(Object.keys(ctx).sort()).toEqual(["loading", "signInWithEmail", "signOut", "supabaseReady", "user"]);
  });

  it("never loads Supabase for a visitor with no saved session", async () => {
    mount();
    expect(screen.getByText("nobody")).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 10));
    expect(fake.getSupabase).not.toHaveBeenCalled();
  });

  it("does not crash and reports nobody when Supabase is not configured", () => {
    fake.state.ready = false;
    fake.state.stored = true;
    mount();
    expect(screen.getByText("nobody")).toBeInTheDocument();
    expect(fake.getSupabase).not.toHaveBeenCalled();
  });

  it("restores a saved session on load", async () => {
    Object.assign(fake.state, { stored: true, session: { user: { email: "admin@apex.test" } } });
    mount();
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("admin@apex.test")).toBeInTheDocument();
  });

  it("follows auth state events once connected", async () => {
    Object.assign(fake.state, { stored: true, session: null });
    mount();
    await screen.findByText("nobody");
    act(() => fake.state.listener("SIGNED_IN", { user: { email: "admin@apex.test" } }));
    expect(screen.getByText("admin@apex.test")).toBeInTheDocument();
    act(() => fake.state.listener("SIGNED_OUT", null));
    expect(screen.getByText("nobody")).toBeInTheDocument();
  });

  it("unsubscribes the auth listener on unmount", async () => {
    fake.state.stored = true;
    const { unmount } = mount();
    await screen.findByText("nobody");
    unmount();
    expect(fake.auth.unsubscribe).toHaveBeenCalledOnce();
  });

  it("signInWithEmail loads Supabase on demand, passes credentials and sets the user", async () => {
    fake.auth.signInWithPassword.mockResolvedValue({ data: { user: { email: "a@b.c" } }, error: null });
    mount();
    await act(async () => { await ctx.signInWithEmail("a@b.c", "pw"); });
    expect(fake.getSupabase).toHaveBeenCalled();
    expect(fake.auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@b.c", password: "pw" });
    expect(screen.getByText("a@b.c")).toBeInTheDocument();
  });

  it("signInWithEmail throws Supabase errors to the caller", async () => {
    fake.auth.signInWithPassword.mockResolvedValue({ data: null, error: new Error("Invalid login credentials") });
    mount();
    await expect(ctx.signInWithEmail("a@b.c", "bad")).rejects.toThrow("Invalid login credentials");
  });

  it("signOut clears the user", async () => {
    Object.assign(fake.state, { stored: true, session: { user: { email: "admin@apex.test" } } });
    mount();
    await screen.findByText("admin@apex.test");
    await act(() => ctx.signOut());
    expect(screen.getByText("nobody")).toBeInTheDocument();
  });

  it("signOut force-clears the user after 3s if Supabase hangs (lock bug)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    Object.assign(fake.state, { stored: true, session: { user: { email: "admin@apex.test" } } });
    mount();
    await screen.findByText("admin@apex.test");

    vi.useFakeTimers();
    fake.auth.signOut.mockImplementation(() => new Promise(() => {}));
    let done = false;
    act(() => { ctx.signOut().then(() => { done = true; }); });
    await act(() => vi.advanceTimersByTimeAsync(2999));
    expect(done).toBe(false);
    expect(screen.getByText("admin@apex.test")).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(done).toBe(true);
    expect(screen.getByText("nobody")).toBeInTheDocument();
    expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/timed out/));
  });
});
