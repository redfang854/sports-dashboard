import { useState } from "react";
import styles from "./UpdatedNote.module.css";

export const STALE_AFTER_DAYS = 60;

// "Updated 27 Oct 2026 · Source: ..." line for hand-maintained data (WRC,
// boxing, rugby) that has no live API. Past STALE_AFTER_DAYS it switches
// to a warning so stale figures are flagged instead of silently shown.
export default function UpdatedNote({ date, source, now: nowProp }) {
  // Clock read once per mount (not during every render); tests pass `now`.
  const [mountedAt] = useState(() => Date.now());
  const now = nowProp ?? mountedAt;
  const updated = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(updated.getTime())) return null;
  const ageDays = Math.floor((now - updated.getTime()) / 86_400_000);
  const stale = ageDays > STALE_AFTER_DAYS;
  const label = updated.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  return (
    <p className={`${styles.note} ${stale ? styles.stale : ""}`} role={stale ? "status" : undefined}>
      {stale ? "May be out of date · last updated " : "Updated "}
      <time dateTime={date}>{label}</time>
      {source && <> · Source: {source}</>}
    </p>
  );
}
