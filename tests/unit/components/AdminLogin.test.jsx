// @vitest-environment jsdom
/**
 * UNIT — src/components/AdminLogin.jsx (the unlisted /admin sign-in form)
 *
 * useAuth() is mocked, so no Supabase calls are made.
 *
 * Goes right: email/password are sent to signInWithEmail; the button shows
 * progress and re-enables afterwards.
 * Goes wrong (each asserted): wrong credentials (error shown, form usable again),
 * Supabase not configured (no form at all), a signed-in non-admin account (told
 * so, offered sign out, never shown the form), and sign-in hanging on the
 * supabase-js lock bug (after 8s shows a clear message instead of spinning).
 * Regression guard: no sign-up, Google, or password-reset controls.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

const auth = vi.hoisted(() => ({ value: null }));
vi.mock("../../../src/context/AuthContext", () => ({ useAuth: () => auth.value }));

import AdminLogin from "../../../src/components/AdminLogin.jsx";

const ADMIN = "admin@apex.test";
beforeEach(() => {
  auth.value = { user: null, supabaseReady: true, signInWithEmail: vi.fn(async () => ({})), signOut: vi.fn() };
  localStorage.clear();
});
afterEach(() => vi.useRealTimers());

function fillAndSubmit(email = ADMIN, password = "secret") {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("AdminLogin", () => {
  it("shows only an email/password form (no sign-up, Google or reset)", () => {
    render(<AdminLogin adminEmail={ADMIN} />);
    expect(screen.getByRole("heading", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("type", "password");
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryByText(/create account|sign up|google|forgot|reset/i)).not.toBeInTheDocument();
  });

  it("uses password-manager friendly autocomplete attributes", () => {
    render(<AdminLogin adminEmail={ADMIN} />);
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("autocomplete", "current-password");
  });

  it("submits the entered credentials", async () => {
    render(<AdminLogin adminEmail={ADMIN} />);
    await act(async () => fillAndSubmit());
    expect(auth.value.signInWithEmail).toHaveBeenCalledWith(ADMIN, "secret");
  });

  it("disables the button while signing in, then re-enables it", async () => {
    let finish;
    auth.value.signInWithEmail = vi.fn(() => new Promise((r) => { finish = r; }));
    render(<AdminLogin adminEmail={ADMIN} />);
    act(() => fillAndSubmit());
    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
    await act(async () => finish({}));
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeEnabled();
  });

  it("shows Supabase's error message for bad credentials", async () => {
    auth.value.signInWithEmail = vi.fn(async () => { throw new Error("Invalid login credentials"); });
    render(<AdminLogin adminEmail={ADMIN} />);
    await act(async () => fillAndSubmit(ADMIN, "wrong"));
    expect(screen.getByText("Invalid login credentials")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeEnabled();
  });

  it("does not render the form when Supabase is not configured", () => {
    auth.value.supabaseReady = false;
    render(<AdminLogin adminEmail={ADMIN} />);
    expect(screen.getByText(/supabase is not configured/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it("tells a signed-in non-admin they are not the admin and offers sign out", () => {
    auth.value.user = { email: "fan@example.com" };
    render(<AdminLogin adminEmail={ADMIN} />);
    expect(screen.getByText(/fan@example\.com, which is not the admin account/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(auth.value.signOut).toHaveBeenCalledOnce();
  });

  it("treats any signed-in user as wrong account when no admin email is configured", () => {
    auth.value.user = { email: "someone@example.com" };
    render(<AdminLogin adminEmail={undefined} />);
    expect(screen.getByText(/not the admin account/i)).toBeInTheDocument();
  });

  it("shows a clear message if sign-in hangs for 8 seconds and no session was stored", async () => {
    vi.useFakeTimers();
    auth.value.signInWithEmail = vi.fn(() => new Promise(() => {})); // never settles
    render(<AdminLogin adminEmail={ADMIN} />);
    act(() => fillAndSubmit());
    await act(() => vi.advanceTimersByTimeAsync(7999));
    expect(screen.queryByText(/taking longer than expected/i)).not.toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByText(/taking longer than expected/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeEnabled();
  });
});
