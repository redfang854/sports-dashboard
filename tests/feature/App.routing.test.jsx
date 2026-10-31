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
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

const auth = vi.hoisted(() => ({ value: null }));
vi.mock("../../src/context/AuthContext", () => ({ useAuth: () => auth.value }));

vi.mock("../../src/components/LoadingScreen", () => ({
  default: function LoadingScreen({ onDone }) { useEffect(() => { onDone(); }, [onDone]); return <div data-testid="intro" />; },
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

beforeEach(() => { auth.value = visitor(); sessionStorage.clear(); });

describe("public visitor", () => {
  it("sees the six sport tabs, football by default, and no auth or chat UI", async () => {
    await renderAt("/");
    const tabs = screen.getAllByRole("tab").map((t) => t.textContent);
    expect(tabs).toEqual(["Football", "Formula 1", "MMA", "Boxing", "Rugby", "WRC"]);
    await waitFor(() => expect(screen.getByTestId("view")).toHaveTextContent("football-view"));
    expect(screen.queryByRole("button", { name: /sign in|sign out/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/chat|online/i)).not.toBeInTheDocument();
  });

  it("switches views when a sport tab is clicked, and puts the tab in the URL", async () => {
    await renderAt("/");
    fireEvent.click(screen.getByRole("tab", { name: "WRC" }));
    await waitFor(() => expect(screen.getByTestId("view")).toHaveTextContent("wrc-view"));
    expect(screen.getByRole("tab", { name: "WRC" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("path")).toHaveTextContent("/wrc");
    expect(document.title).toBe("WRC · Apex");
  });

  it("still honours old #sport links (e.g. /#boxing)", async () => {
    await renderAt("/#boxing");
    await waitFor(() => expect(screen.getByTestId("view")).toHaveTextContent("boxing-view"));
  });

  it("gets the admin sign-in form at /admin and never AdminView", async () => {
    await renderAt("/admin");
    expect(await screen.findByRole("heading", { name: "Admin" })).toBeInTheDocument();
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
    expect(screen.getByTestId("path")).toHaveTextContent("/rugby");
    await waitFor(() => expect(screen.getByTestId("view")).toHaveTextContent("rugby-view"));
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
    await screen.findByTestId("view");
    await waitFor(() => expect(screen.getByTestId("view")).toHaveTextContent("admin-view"));
    expect(screen.getByRole("tab", { name: "Admin" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(auth.value.signOut).toHaveBeenCalledOnce();
  });

  it("sees the Admin tab on the public site and it navigates to /admin", async () => {
    await renderAt("/");
    fireEvent.click(screen.getByRole("tab", { name: "Admin" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/admin");
    await waitFor(() => expect(screen.getByTestId("view")).toHaveTextContent("admin-view"));
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

describe("reloading keeps the visitor where they were", () => {
  it.each([["/f1", "f1-view", "Formula 1"], ["/boxing", "boxing-view", "Boxing"], ["/rugby/", "rugby-view", "Rugby"], ["/MMA", "mma-view", "MMA"]])(
    "%s opens %s directly", async (path, view, tab) => {
      await renderAt(path);
      await waitFor(() => expect(screen.getByTestId("view")).toHaveTextContent(view));
      expect(screen.getByRole("tab", { name: tab })).toHaveAttribute("aria-selected", "true");
    }
  );

  it("unknown paths fall back to Football instead of a blank page", async () => {
    await renderAt("/nonsense");
    await waitFor(() => expect(screen.getByTestId("view")).toHaveTextContent("football-view"));
  });

  it("plays the intro on the first visit and records it for the session", async () => {
    await renderAt("/");
    expect(sessionStorage.getItem("apex:intro-seen")).toBe("1");
  });

  it("skips the intro on a reload in the same session", async () => {
    sessionStorage.setItem("apex:intro-seen", "1");
    await renderAt("/boxing");
    expect(screen.queryByTestId("intro")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("view")).toHaveTextContent("boxing-view"));
  });

  it("does not repeat a navigation when the current tab is clicked", async () => {
    await renderAt("/f1");
    fireEvent.click(screen.getByRole("tab", { name: "Formula 1" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/f1");
  });
});

describe("credits and About page", () => {
  it("footer credits the author and links to the source code and About page", async () => {
    await renderAt("/");
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent(/Built by Brian Hinga/);
    expect(screen.getByRole("link", { name: "Source on GitHub" })).toHaveAttribute("href", "https://github.com/redfang854/sports-dashboard");
    expect(footer).toHaveTextContent(/Wikipedia \(CC BY-SA 4\.0\)/);
  });

  it("the footer About link opens /about without a full page load", async () => {
    await renderAt("/f1");
    fireEvent.click(screen.getByRole("link", { name: /About & data credits/ }));
    expect(screen.getByTestId("path")).toHaveTextContent("/about");
    expect(await screen.findByRole("heading", { level: 1, name: /built by Brian Hinga/ })).toBeInTheDocument();
    expect(document.title).toBe("About · Apex");
  });

  it("/about lists every data source and the CC BY-SA licence, with no sport tab selected", async () => {
    await renderAt("/about");
    await screen.findByRole("heading", { name: "Data sources and credits" });
    for (const src of ["football-data.org", "Jolpica", "API-Football", "Wikipedia", "Wikimedia Commons", "BBC Sport"]) {
      expect(screen.getAllByText(new RegExp(src)).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("link", { name: /Creative Commons Attribution-ShareAlike 4\.0/ })).toHaveAttribute("href", "https://creativecommons.org/licenses/by-sa/4.0/");
    expect(screen.getAllByRole("tab").every((t) => t.getAttribute("aria-selected") === "false")).toBe(true);
  });
});

