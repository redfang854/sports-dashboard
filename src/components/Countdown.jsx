import { useCountdown } from "../hooks/useCountdown";
import styles from "./Countdown.module.css";

const CIRCUIT_PATHS = {
  "Miami Grand Prix": "M 20 80 L 20 40 Q 20 20 40 20 L 120 20 Q 140 20 140 40 L 140 60 Q 140 75 125 75 L 90 75 Q 75 75 75 90 L 75 110 Q 75 130 55 130 L 35 130 Q 20 130 20 110 Z",
  "Monaco Grand Prix": "M 25 100 L 25 60 Q 25 30 50 25 L 80 20 L 120 30 L 130 60 L 110 80 L 90 75 L 70 85 L 65 110 L 45 115 Z",
  "Canadian Grand Prix": "M 20 70 L 20 40 L 60 20 L 100 20 L 130 40 L 130 80 L 110 100 L 80 110 L 80 90 L 60 90 L 60 110 L 40 100 Z",
  "Spanish Grand Prix": "M 20 80 L 20 40 Q 20 20 45 20 L 115 20 Q 140 20 140 45 L 140 65 L 120 65 L 120 85 Q 120 100 105 100 L 75 100 L 75 115 L 50 115 L 50 100 L 35 100 Q 20 100 20 80 Z",
  "Austrian Grand Prix": "M 30 100 L 30 50 L 60 20 L 110 20 L 140 50 L 140 80 L 110 100 L 110 80 L 80 80 L 80 100 Z",
  "British Grand Prix": "M 25 85 L 25 45 Q 25 20 55 20 L 105 20 Q 135 20 135 50 L 135 70 L 115 80 L 100 70 L 85 80 L 85 100 L 65 110 L 45 105 Z",
  "Hungarian Grand Prix": "M 20 80 L 30 40 L 70 20 L 110 30 L 130 60 L 120 90 L 100 100 L 80 90 L 70 100 L 50 110 L 30 100 Z",
  "Belgian Grand Prix": "M 20 90 L 20 50 L 50 20 L 90 20 L 130 40 L 130 70 L 110 90 L 90 80 L 70 90 L 70 110 L 45 120 Z",
  "Dutch Grand Prix": "M 25 95 L 25 45 Q 25 20 55 20 L 105 20 Q 135 20 135 50 L 135 80 Q 135 100 110 100 L 90 100 L 90 115 L 60 115 L 60 100 L 40 100 Z",
  "Italian Grand Prix": "M 20 80 L 20 30 L 80 20 L 140 30 L 140 80 L 100 100 L 100 80 L 60 80 L 60 100 Z",
  "Azerbaijan Grand Prix": "M 20 110 L 20 30 L 80 20 L 130 30 L 130 60 L 110 60 L 110 80 L 130 80 L 130 110 L 80 120 Z",
  "Singapore Grand Prix": "M 20 100 L 20 50 L 50 20 L 100 20 L 130 50 L 130 70 L 110 70 L 110 90 L 130 90 L 130 110 L 90 120 L 50 115 Z",
  "United States Grand Prix": "M 25 90 L 25 45 L 60 20 L 110 20 L 135 45 L 135 75 L 115 90 L 90 85 L 80 100 L 60 110 L 40 105 Z",
  "Mexico City Grand Prix": "M 20 80 L 20 40 Q 20 20 50 20 L 110 20 Q 140 20 140 50 L 140 80 Q 140 100 110 100 L 90 100 L 90 115 L 60 115 L 60 100 L 40 100 Q 20 100 20 80 Z",
  "São Paulo Grand Prix": "M 30 100 L 25 50 L 60 20 L 110 25 L 130 55 L 115 80 L 95 75 L 85 95 L 65 110 Z",
  "Las Vegas Grand Prix": "M 20 80 L 20 40 L 50 20 L 110 20 L 140 40 L 140 80 L 110 100 L 80 100 L 80 115 L 50 115 L 50 100 L 30 100 Z",
  "Qatar Grand Prix": "M 25 90 L 25 40 Q 30 20 60 20 L 110 20 Q 135 20 135 45 L 135 75 Q 135 95 110 100 L 80 105 L 80 90 L 55 90 L 55 105 L 35 100 Z",
  "Abu Dhabi Grand Prix": "M 20 80 L 20 40 L 60 20 L 100 20 L 130 40 L 130 70 L 110 80 L 110 60 L 80 60 L 80 80 L 100 90 L 80 110 L 50 110 L 30 100 Z",
  "Bahrain Grand Prix": "M 25 90 L 25 45 L 55 20 L 105 20 L 135 45 L 135 75 L 115 85 L 100 75 L 85 85 L 80 105 L 60 115 L 40 108 Z",
  "Saudi Arabian Grand Prix": "M 20 110 L 20 30 L 70 20 L 130 30 L 130 60 L 100 60 L 100 80 L 130 80 L 130 110 L 70 120 Z",
  "Australian Grand Prix": "M 25 85 L 25 45 Q 30 20 65 20 L 105 20 Q 135 20 135 50 L 135 80 Q 130 105 100 108 L 70 110 L 60 95 L 80 85 L 80 65 L 55 65 L 55 90 L 40 100 Z",
  "Japanese Grand Prix": "M 20 90 L 20 40 L 55 20 L 95 20 L 95 45 L 75 45 L 75 65 L 120 65 L 130 85 L 110 105 L 70 110 L 45 105 Z",
  "Chinese Grand Prix": "M 20 80 L 20 40 Q 20 20 50 20 L 100 20 Q 130 20 130 50 L 130 75 L 110 85 L 90 75 L 80 90 L 60 100 L 40 95 Z",
  "Emilia Romagna Grand Prix": "M 30 90 L 30 50 Q 30 20 60 20 L 100 20 Q 130 20 130 50 L 130 70 L 110 70 L 110 90 Q 110 110 90 110 L 70 110 Q 50 110 50 130 L 30 130 Z",
};

const DEFAULT_PATH = "M 30 90 L 25 45 Q 30 20 65 20 L 105 20 Q 135 20 135 50 L 135 80 Q 130 100 100 105 L 65 108 L 45 95 Z";

function CircuitOutline({ raceName }) {
  const path = CIRCUIT_PATHS[raceName] || DEFAULT_PATH;
  return (
    <svg viewBox="0 0 160 140" className={styles.circuit} xmlns="http://www.w3.org/2000/svg">
      <path d={path} fill="none" stroke="#ffffff18" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke="#e10600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
      <CircuitOutline raceName={eventName} />
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
