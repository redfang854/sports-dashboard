// @vitest-environment jsdom
/**
 * UNIT — src/context/AuthContext.jsx (admin-only session state)
 *
 * The Supabase client is replaced with a fake, so no real auth calls are made.
 *
 * Goes right: an existing session is restored on load, auth events update the
 * user, sign-in/out go through Supabase.
 * Goes wrong (each asserted): Supabase not configured (must not crash, user stays
 * null), sign-in errors propagate to the caller, signOut() hanging on the
 * supabase-js lock bug (must force-clear after 3s), and the auth listener must be
 * unsubscribed on unmount (no leaks).
 * Regression guard: the removed public features (sign-up, Google, password reset,
 * profiles) must not come back into the context's public API.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";

const fake = vi.hoisted(() => {
  const state = { ready: true, session: null, listener: null };
  const auth = {
    getSession: vi.fn(async () => ({ data: { session: state.session } })),
    onAuthStateChange: vi.fn((cb) => {
      state.listener = cb;
      return { data: { subscription: { unsubscribe: auth.unsubscribe } } };
    }),
    unsubscribe: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(async () => ({ error: null })),
  };
  return { state, auth };
});

vi.mock("../../../src/lib/supabase", () => ({
  get supabaseReady() { return fake.state.ready; },
  get supabase() { return fake.state.ready ? { auth: fake.auth } : null; },
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
  fake.state.ready = true;
  fake.state.session = null;
  fake.state.listener = null;
  Object.values(fake.auth).forEach((f) => f.mockClear?.());
});
afterEach(() => vi.useRealTimers());

describe("AuthContext", () => {
  it("exposes only the admin-auth API (removed features stay removed)", async () => {
    mount();
    await waitFor(() => expect(ctx.loading).toBe(false));
    expect(Object.keys(ctx).sort()).toEqual(["loading", "signInWithEmail", "signOut", "supabaseReady", "user"]);
  });

  it("does not crash and reports nobody when Supabase is not configured", async () => {
    fake.state.ready = false;
    mount();
    expect(await screen.findByText("nobody")).toBeInTheDocument();
    expect(fake.auth.getSession).not.toHaveBeenCalled();
  });

  it("restores an existing session on load", async () => {
    fake.state.session = { user: { email: "admin@apex.test" } };
    mount();
    expect(await screen.findByText("admin@apex.test")).toBeInTheDocument();
  });

  it("updates the user on auth state changes", async () => {
    mount();
    await screen.findByText("nobody");
    act(() => fake.state.listener("SIGNED_IN", { user: { email: "admin@apex.test" } }));
    expect(screen.getByText("admin@apex.test")).toBeInTheDocument();
    act(() => fake.state.listener("SIGNED_OUT", null));
    expect(screen.getByText("nobody")).toBeInTheDocument();
  });

  it("unsubscribes the auth listener on unmount", async () => {
    const { unmount } = mount();
    await screen.findByText("nobody");
    unmount();
    expect(fake.auth.unsubscribe).toHaveBeenCalledOnce();
  });

  it("signInWithEmail passes credentials through and returns data", async () => {
    fake.auth.signInWithPassword.mockResolvedValue({ data: { user: { email: "a@b.c" } }, error: null });
    mount();
    await screen.findByText("nobody");
    await expect(ctx.signInWithEmail("a@b.c", "pw")).resolves.toEqual({ user: { email: "a@b.c" } });
    expect(fake.auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@b.c", password: "pw" });
  });

  it("signInWithEmail throws Supabase errors to the caller", async () => {
    fake.auth.signInWithPassword.mockResolvedValue({ data: null, error: new Error("Invalid login credentials") });
    mount();
    await screen.findByText("nobody");
    await expect(ctx.signInWithEmail("a@b.c", "bad")).rejects.toThrow("Invalid login credentials");
  });

  it("signOut clears the user when Supabase completes normally", async () => {
    fake.state.session = { user: { email: "admin@apex.test" } };
    fake.auth.signOut.mockImplementation(async () => {
      fake.state.listener("SIGNED_OUT", null);
      return { error: null };
    });
    mount();
    await screen.findByText("admin@apex.test");
    await act(() => ctx.signOut());
    expect(screen.getByText("nobody")).toBeInTheDocument();
  });

  it("signOut force-clears the user after 3s if Supabase hangs (lock bug)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fake.state.session = { user: { email: "admin@apex.test" } };
    mount();
    await screen.findByText("admin@apex.test");

    vi.useFakeTimers();
    fake.auth.signOut.mockImplementation(() => new Promise(() => {})); // never settles
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
