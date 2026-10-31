// @vitest-environment jsdom
/**
 * FEATURE — src/App.jsx routing, header and footer (whole shell rendered)
 *
 * Renders the real App inside a router. Sport views and the loading animation
 * are stubbed (they make their own API calls and are not what is under test).
 *
 * Goes right: the six sport tabs, one URL per tab, reloads keep the tab, the
 * intro plays once per session, /about and the footer credits work.
 * Goes wrong (asserted): any login, sign-in, admin or chat UI reappearing
 * (the site deliberately has no accounts), /admin exposing anything, unknown
 * paths showing a blank page, tab clicks not updating the URL.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";


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

let App;

function Location() {
  return <div data-testid="path">{useLocation().pathname}</div>;
}

async function renderAt(path) {
  vi.resetModules();
  App = (await import("../../src/App.jsx")).default;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path="*" element={<><App /><Location /></>} /></Routes>
    </MemoryRouter>
  );
}

beforeEach(() => { sessionStorage.clear(); });

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
});

describe("no accounts anywhere", () => {
  it.each(["/", "/football", "/about"])("%s has no sign-in, sign-out, admin or chat controls", async (path) => {
    await renderAt(path);
    await screen.findAllByRole("tab");
    expect(screen.queryByRole("button", { name: /sign in|sign out|log in|log out|register/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /admin/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/chat|online/i)).not.toBeInTheDocument();
  });

  it("/admin no longer exists: it falls back to Football with no form", async () => {
    await renderAt("/admin");
    await waitFor(() => expect(screen.getByTestId("view")).toHaveTextContent("football-view"));
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /admin/i })).not.toBeInTheDocument();
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

