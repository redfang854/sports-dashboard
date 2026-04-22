import { useState, useEffect } from "react";

/**
 * Generic data-fetching hook.
 * @param {Function} fetcher  — async function that returns data
 * @param {Array}    deps     — dependency array (re-fetches when these change)
 *
 * Returns { data, loading, error, refetch }
 */
export function useFetch(fetcher, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tick,    setTick]    = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load data");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [...deps, tick]);

  return { data, loading, error, refetch };
}
