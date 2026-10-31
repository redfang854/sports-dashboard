// Compact relative time for news items: "just now", "5m ago", "3h ago",
// "2d ago", then a short date once the item is a week old. `now` is
// injectable so tests are deterministic.
export function timeAgo(iso, now = Date.now()) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((now - then) / 60000);
  if (mins < 1)  return "just now";   // also covers slightly-future clocks
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(then).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
