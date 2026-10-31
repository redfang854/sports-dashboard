// @vitest-environment jsdom
/**
 * FEATURE — src/App.jsx routing, header and admin gating (whole shell rendered)
 *
 * Renders the real App inside a router. Sport views, AdminView and the loading
 * animation are stubbed (they make their own API calls and are not what is
 * under test); useAuth() is mocked to simulate visitor / non-admin / admin.
 *
 * Goes right: visitors see the six sport tabs and no auth UI; /admin shows the
 * sign-in form; the admin sees the Admin tab, AdminView and a Sign out button.
 * Goes wrong (each asserted): chat or Sign in creeping back into the header, a
 * non-admin session seeing the Admin tab or AdminView, AdminView flashing while
 * auth is still loading, VITE_ADMIN_EMAIL missing (must lock everyone out, not
 * let everyone in), and sport tabs failing to leave /admin.
 * Note: hiding UI is cosmetic. The server-side check is covered in
 * tests/unit/api/verifyAdmin.test.js.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

const auth = vi.hoisted(() => ({ value: null }));
vi.mock("../../src/context/AuthContext", () => ({ useAuth: () => auth.value }));

vi.mock("../../src/components/LoadingScreen", () => ({
  default: function LoadingScreen({ onDone }) { useEffect(() => { onDone(); }, [onDone]); return null; },
}));
const stub = (name) => ({ default: () => <div data-testid="view">{name}</div> });
vi.mock("../../src/views/FootballView", () => stub("football-view"));
vi.mock("../../src/views/F1View", () => stub("f1-view"));
vi.mock("../../src/views/MmaView", () => stub("mma-view"));
vi.mock("../../src/views/BoxingView", () => stub("boxing-view"));
vi.mock("../../src/views/RugbyView", () => stub("rugby-view"));
vi.mock("../../src/views/WrcView", () => stub("wrc-view"));
vi.mock("../../src/views/AdminView", () => stub("admin-view"));

const ADMIN = "admin@apex.test";
let App;

function Location() {
  return <div data-testid="path">{useLocation().pathname}</div>;
}

async function renderAt(path, { adminEmail = ADMIN } = {}) {
  vi.stubEnv("VITE_ADMIN_EMAIL", adminEmail);
  vi.resetModules(); // App reads VITE_ADMIN_EMAIL at import time
  App = (await import("../../src/App.jsx")).default;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path="*" element={<><App /><Location /></>} /></Routes>
    </MemoryRouter>
  );
}

const signedIn = (email) => ({ user: { email }, loading: false, supabaseReady: true, signInWithEmail: vi.fn(), signOut: vi.fn() });
const visitor = () => ({ user: null, loading: false, supabaseReady: true, signInWithEmail: vi.fn(), signOut: vi.fn() });

beforeEach(() => { auth.value = visitor(); });

describe("public visitor", () => {
  it("sees the six sport tabs, football by default, and no auth or chat UI", async () => {
    await renderAt("/");
    const tabs = screen.getAllByRole("tab").map((t) => t.textContent);
    expect(tabs).toEqual(["Football", "Formula 1", "MMA", "Boxing", "Rugby", "WRC"]);
    expect(screen.getByTestId("view")).toHaveTextContent("football-view");
    expect(screen.queryByRole("button", { name: /sign in|sign out/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/chat|online/i)).not.toBeInTheDocument();
  });

  it("switches views when a sport tab is clicked", async () => {
    await renderAt("/");
    fireEvent.click(screen.getByRole("tab", { name: "WRC" }));
    expect(screen.getByTestId("view")).toHaveTextContent("wrc-view");
    expect(screen.getByRole("tab", { name: "WRC" })).toHaveAttribute("aria-selected", "true");
  });

  it("opens the sport named in the URL hash", async () => {
    window.location.hash = "#boxing";
    await renderAt("/");
    expect(screen.getByTestId("view")).toHaveTextContent("boxing-view");
    window.location.hash = "";
  });

  it("gets the admin sign-in form at /admin and never AdminView", async () => {
    await renderAt("/admin");
    expect(screen.getByRole("heading", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.queryByText("admin-view")).not.toBeInTheDocument();
  });

  it("also gets the form at /admin/ (trailing slash)", async () => {
    await renderAt("/admin/");
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("leaves /admin when a sport tab is clicked", async () => {
    await renderAt("/admin");
    fireEvent.click(screen.getByRole("tab", { name: "Rugby" }));
    expect(screen.getByTestId("path")).toHaveTextContent(/^\/$/);
    expect(screen.getByTestId("view")).toHaveTextContent("rugby-view");
  });
});

describe("signed-in non-admin (e.g. a leftover chat-era account)", () => {
  beforeEach(() => { auth.value = signedIn("fan@example.com"); });

  it("sees no Admin tab and no Sign out on the public site", async () => {
    await renderAt("/");
    expect(screen.queryByRole("tab", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
  });

  it("is told they are not the admin at /admin, and AdminView is not rendered", async () => {
    await renderAt("/admin");
    expect(screen.getByText(/not the admin account/i)).toBeInTheDocument();
    expect(screen.queryByText("admin-view")).not.toBeInTheDocument();
  });
});

describe("admin", () => {
  beforeEach(() => { auth.value = signedIn(ADMIN); });

  it("lands on AdminView at /admin with a Sign out button", async () => {
    await renderAt("/admin");
    expect(screen.getByTestId("view")).toHaveTextContent("admin-view");
    expect(screen.getByRole("tab", { name: "Admin" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(auth.value.signOut).toHaveBeenCalledOnce();
  });

  it("sees the Admin tab on the public site and it navigates to /admin", async () => {
    await renderAt("/");
    fireEvent.click(screen.getByRole("tab", { name: "Admin" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/admin");
    expect(screen.getByTestId("view")).toHaveTextContent("admin-view");
  });
});

describe("misconfiguration and loading", () => {
  it("locks everyone out if VITE_ADMIN_EMAIL is missing", async () => {
    auth.value = signedIn(ADMIN);
    await renderAt("/admin", { adminEmail: "" });
    expect(screen.queryByText("admin-view")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("shows neither the form nor AdminView while auth is still loading", async () => {
    auth.value = { ...visitor(), loading: true };
    await renderAt("/admin");
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(screen.queryByText("admin-view")).not.toBeInTheDocument();
  });
});
