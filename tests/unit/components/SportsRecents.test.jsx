// @vitest-environment jsdom
/**
 * UNIT — src/components/SportsRecents.jsx (the "Sports Recents" section)
 *
 * fetch is stubbed, so this checks the component's behaviour for every response
 * /api/news can give, without a server or network.
 *
 * Goes right: shows a loading line, then a lead story (image, headline, summary,
 * time) plus compact links for the rest, all opening in a new tab safely.
 * Goes wrong (each asserted): API error, network failure, empty list, missing
 * image, broken image URL, unmounting mid-request (no state update after
 * unmount), and switching sports (refetches with the new sport).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SportsRecents from "../../../src/components/SportsRecents.jsx";

const iso = (minsAgo) => new Date(Date.now() - minsAgo * 60_000).toISOString();
const items = [
  { title: "Lead story", summary: "Lead summary", url: "https://news.test/lead", image: "https://img.test/lead.jpg", publishedAt: iso(5), source: "BBC Sport" },
  { title: "Second story", summary: "", url: "https://news.test/2", image: null, publishedAt: iso(120), source: "BBC Sport" },
  { title: "Third story", summary: "", url: "https://news.test/3", image: null, publishedAt: iso(60 * 24 * 2), source: "BBC Sport" },
];
const json = (body, ok = true, status = 200) => ({ ok, status, json: async () => body });

let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn(async () => json({ items }));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("SportsRecents", () => {
  it("is labelled 'Sports Recents' (not the old 'Season Recap')", async () => {
    render(<SportsRecents sport="football" />);
    expect(screen.getByRole("region", { name: "Sports Recents" })).toBeInTheDocument();
    expect(screen.getByText("Sports Recents")).toBeInTheDocument();
    expect(screen.queryByText(/season recap/i)).not.toBeInTheDocument();
    await screen.findByText("Lead story");
  });

  it("requests news for its sport", async () => {
    render(<SportsRecents sport="mma" />);
    await screen.findByText("Lead story");
    expect(fetchMock).toHaveBeenCalledWith("/api/news?sport=mma");
  });

  it("shows a loading message until data arrives", async () => {
    render(<SportsRecents sport="football" />);
    expect(screen.getByText(/loading latest news/i)).toBeInTheDocument();
    await screen.findByText("Lead story");
    expect(screen.queryByText(/loading latest news/i)).not.toBeInTheDocument();
  });

  it("renders the lead story with image, summary, time and source credit", async () => {
    const { container } = render(<SportsRecents sport="football" />);
    await screen.findByText("Lead story");
    expect(screen.getByText("Lead summary")).toBeInTheDocument();
    expect(screen.getByText("5m ago")).toBeInTheDocument();
    expect(screen.getByText("via BBC Sport")).toBeInTheDocument();
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "https://img.test/lead.jpg");
    expect(img).toHaveAttribute("alt", ""); // decorative: headline is the link text
  });

  it("renders the remaining stories as a list with relative times", async () => {
    render(<SportsRecents sport="football" />);
    await screen.findByText("Lead story");
    const list = screen.getByRole("list");
    expect(list.querySelectorAll("li")).toHaveLength(2);
    expect(screen.getByText("2h ago")).toBeInTheDocument();
    expect(screen.getByText("2d ago")).toBeInTheDocument();
  });

  it("opens every link in a new tab with noopener noreferrer", async () => {
    render(<SportsRecents sport="football" />);
    await screen.findByText("Lead story");
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(items.map((i) => i.url));
    for (const a of links) {
      expect(a).toHaveAttribute("target", "_blank");
      expect(a).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("renders a lead story without an image when none is provided", async () => {
    fetchMock.mockResolvedValue(json({ items: [{ ...items[0], image: null }] }));
    const { container } = render(<SportsRecents sport="football" />);
    await screen.findByText("Lead story");
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("hides the image if it fails to load instead of showing a broken icon", async () => {
    const { container } = render(<SportsRecents sport="football" />);
    await screen.findByText("Lead story");
    const img = container.querySelector("img");
    fireEvent.error(img);
    expect(img.style.display).toBe("none");
  });

  it.each([
    ["an API error status", () => json({ error: "News feed unavailable", items: [] }, false, 502)],
    ["a network failure", () => { throw new TypeError("Failed to fetch"); }],
    ["an empty list", () => json({ items: [] })],
    ["a response without items", () => json({})],
  ])("shows a fallback message on %s", async (_, impl) => {
    fetchMock.mockImplementation(async () => impl());
    render(<SportsRecents sport="wrc" />);
    expect(await screen.findByText(/latest news is unavailable/i)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("refetches when the sport changes", async () => {
    const { rerender } = render(<SportsRecents sport="football" />);
    await screen.findByText("Lead story");
    fetchMock.mockResolvedValue(json({ items: [{ ...items[1], title: "F1 story" }] }));
    rerender(<SportsRecents sport="f1" />);
    expect(await screen.findByText("F1 story")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith("/api/news?sport=f1");
  });

  it("unmounting mid-request does not throw when the response arrives later", async () => {
    // React 18+ no longer warns about updates after unmount, so this guards the
    // cancelled-flag path against crashes rather than against a warning.
    let resolve;
    fetchMock.mockImplementation(() => new Promise((r) => { resolve = r; }));
    const { unmount } = render(<SportsRecents sport="football" />);
    unmount();
    resolve(json({ items }));
    await new Promise((r) => setTimeout(r, 0));
    expect(console.error).not.toHaveBeenCalled();
  });
});
