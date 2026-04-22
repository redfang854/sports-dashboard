import { useState, useEffect } from "react";

export function useCountdown(targetISO) {
  const calc = () => Math.max(0, new Date(targetISO) - Date.now());
  const [diff, setDiff] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setDiff(calc()), 1000);
    return () => clearInterval(id);
  }, [targetISO]);

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  return { d, h, m, s };
}
