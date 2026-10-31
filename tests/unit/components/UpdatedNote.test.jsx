// @vitest-environment jsdom
/**
 * UNIT — src/components/UpdatedNote.jsx ("Updated <date> · Source" line)
 *
 * Goes right: shows the date and source for hand-maintained data.
 * Goes wrong (asserted): data older than STALE_AFTER_DAYS must switch to a
 * visible warning; an invalid date must render nothing rather than
 * "Invalid Date"; the date must not shift with the viewer's timezone.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import UpdatedNote, { STALE_AFTER_DAYS } from "../../../src/components/UpdatedNote.jsx";

const DAY = 86_400_000;
const updated = "2026-10-27";
const base = Date.parse(`${updated}T00:00:00Z`);

describe("UpdatedNote", () => {
  it("shows the date and source when fresh", () => {
    render(<UpdatedNote date={updated} source="Wikipedia" now={base + 3 * DAY} />);
    expect(screen.getByText(/^Updated/)).toHaveTextContent("Updated 27 Oct 2026 · Source: Wikipedia");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("27 Oct 2026").closest("time")).toHaveAttribute("datetime", updated);
  });

  it(`is still fresh at exactly ${STALE_AFTER_DAYS} days`, () => {
    render(<UpdatedNote date={updated} now={base + STALE_AFTER_DAYS * DAY} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("warns once the data is older than the threshold", () => {
    render(<UpdatedNote date={updated} source="Wikipedia" now={base + (STALE_AFTER_DAYS + 1) * DAY} />);
    expect(screen.getByRole("status")).toHaveTextContent(/may be out of date · last updated 27 Oct 2026/i);
  });

  it("renders nothing for an invalid date", () => {
    const { container } = render(<UpdatedNote date="not-a-date" now={base} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("omits the source when none is given", () => {
    render(<UpdatedNote date={updated} now={base} />);
    expect(screen.getByText(/^Updated/)).not.toHaveTextContent("Source");
  });
});
