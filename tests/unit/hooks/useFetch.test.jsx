// @vitest-environment jsdom
/**
 * UNIT — src/hooks/useFetch.js (used by every live football panel/card)
 *
 * Rewritten so state is only set from fetch callbacks. These pin the
 * behaviour callers rely on: loading -> data, errors, refetch, refetching
 * when deps change, keeping old data visible meanwhile, and ignoring a slow
 * response for deps that are no longer current (race condition).
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFetch } from "../../../src/hooks/useFetch.js";

const deferred = () => { let resolve, reject; const p = new Promise((a, b) => { resolve = a; reject = b; }); return { p, resolve, reject }; };

describe("useFetch", () => {
  it("starts loading, then returns data", async () => {
    const { result } = renderHook(() => useFetch(async () => "hello", []));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe("hello");
    expect(result.current.error).toBeNull();
  });

  it("exposes the error message and stops loading", async () => {
    const { result } = renderHook(() => useFetch(async () => { throw new Error("HTTP 503"); }, []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("HTTP 503");
  });

  it("refetch() runs the fetcher again", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const { result } = renderHook(() => useFetch(fetcher, []));
    await waitFor(() => expect(result.current.data).toBe(1));
    act(() => result.current.refetch());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.data).toBe(2));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("refetches when deps change, keeping old data visible while loading", async () => {
    const { result, rerender } = renderHook(({ id }) => useFetch(async () => `team-${id}`, [id]), { initialProps: { id: 1 } });
    await waitFor(() => expect(result.current.data).toBe("team-1"));
    rerender({ id: 2 });
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe("team-1");
    await waitFor(() => expect(result.current.data).toBe("team-2"));
  });

  it("ignores a slow response for deps that are no longer current", async () => {
    const slow = deferred(), fast = deferred();
    const { result, rerender } = renderHook(({ id }) => useFetch(() => (id === 1 ? slow.p : fast.p), [id]), { initialProps: { id: 1 } });
    rerender({ id: 2 });
    await act(async () => fast.resolve("second"));
    await act(async () => slow.resolve("first (stale)"));
    expect(result.current.data).toBe("second");
    expect(result.current.loading).toBe(false);
  });

  it("does not refetch when only the inline fetcher function changes", async () => {
    const calls = vi.fn();
    const { rerender } = renderHook(() => useFetch(async () => { calls(); return 1; }, ["same"]));
    await waitFor(() => expect(calls).toHaveBeenCalledTimes(1));
    rerender(); rerender();
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toHaveBeenCalledTimes(1);
  });
});
