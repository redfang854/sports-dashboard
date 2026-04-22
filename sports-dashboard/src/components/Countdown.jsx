import { useCountdown } from "../hooks/useCountdown";
import styles from "./Countdown.module.css";

export default function Countdown({ eventName, venueName, target }) {
  const { d, h, m, s } = useCountdown(target);
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <p className={styles.label}>Next up</p>
        <h2 className={styles.eventName}>{eventName}</h2>
        <p className={styles.venue}>{venueName}</p>
      </div>
      <div className={styles.timer}>
        {[{ val: pad(d), unit: "days" }, { val: pad(h), unit: "hrs" }, { val: pad(m), unit: "min" }, { val: pad(s), unit: "sec" }].map(({ val, unit }, i) => (
          <div key={unit} className={styles.unit}>
            {i > 0 && <span className={styles.sep}>:</span>}
            <span className={styles.num}>{val}</span>
            <span className={styles.unitLabel}>{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
