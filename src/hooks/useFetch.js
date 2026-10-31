import { useState, useEffect, useRef } from "react";

/**
 * Generic data-fetching hook.
 * @param {Function} fetcher  async function that returns data
 * @param {Array}    deps     primitive values (ids, codes); refetches when they change
 *
 * Returns { data, loading, error, refetch }.
 *
 * State is only set from the fetch callbacks, never synchronously in the
 * effect body (React 19 rule: avoids an extra cascading render per fetch).
 * "loading" is derived: true until the result for the CURRENT deps arrives.
 * While a new request is in flight the previous data stays visible.
 */
export function useFetch(fetcher, deps = []) {
  const [tick, setTick] = useState(0);
  const key = JSON.stringify([...deps, tick]);
  const [result, setResult] = useState({ key: null, data: null, error: null });

  // Always call the latest fetcher without making it a dependency
  // (callers pass inline arrow functions that change every render).
  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; });

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then(
        (data) => { if (!cancelled) setResult({ key, data, error: null }); },
        (err)  => { if (!cancelled) setResult((r) => ({ key, data: r.data, error: err?.message || "Failed to load data" })); },
      );
    return () => { cancelled = true; };
  }, [key]);

  const current = result.key === key;
  return {
    data: result.data,
    loading: !current,
    error: current ? result.error : null,
    refetch: () => setTick((t) => t + 1),
  };
}
