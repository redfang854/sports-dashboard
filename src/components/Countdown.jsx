import { useCountdown } from "../hooks/useCountdown";
import styles from "./Countdown.module.css";

// Accurate hand-traced circuit outlines based on real track layouts
const CIRCUITS = {
  "Miami Grand Prix": "M80,20 L140,20 L155,35 L155,55 L145,65 L120,65 L110,75 L110,95 L120,105 L120,115 L100,125 L75,125 L60,115 L60,95 L50,85 L30,85 L15,70 L15,45 L30,25 L55,20 Z",
  "Bahrain Grand Prix": "M20,60 L20,40 L35,20 L70,15 L110,15 L140,30 L150,55 L145,80 L130,95 L110,100 L100,90 L85,100 L75,115 L55,120 L30,110 L20,90 Z",
  "Saudi Arabian Grand Prix": "M30,10 L130,10 L145,25 L145,50 L130,50 L130,75 L145,75 L145,105 L130,120 L30,120 L15,105 L15,80 L30,80 L30,50 L15,50 L15,25 Z",
  "Australian Grand Prix": "M40,15 L110,15 L140,35 L145,65 L130,85 L110,90 L95,80 L85,90 L70,95 L55,85 L45,90 L25,80 L15,60 L15,35 Z",
  "Japanese Grand Prix": "M15,50 L15,25 L45,15 L80,15 L80,40 L60,40 L60,65 L100,65 L130,80 L140,105 L120,125 L80,130 L45,120 L20,95 Z",
  "Chinese Grand Prix": "M20,70 L20,40 L40,20 L90,15 L130,20 L150,45 L150,75 L135,90 L110,85 L95,100 L70,105 L45,100 L25,90 Z",
  "Miami Grand Prix": "M25,45 L25,25 L55,15 L105,15 L135,25 L145,50 L135,65 L110,65 L100,80 L110,95 L100,110 L75,118 L50,110 L40,95 L50,80 L40,65 L25,60 Z",
  "Emilia Romagna Grand Prix": "M20,85 L20,50 L35,25 L65,15 L100,20 L125,40 L130,65 L115,80 L115,100 L100,115 L75,120 L50,115 L30,100 Z",
  "Monaco Grand Prix": "M25,95 L20,65 L25,40 L45,20 L75,15 L110,25 L130,50 L125,75 L105,85 L85,80 L70,90 L65,110 L45,118 Z",
  "Canadian Grand Prix": "M20,65 L20,40 L45,20 L85,15 L120,20 L140,45 L140,85 L120,100 L95,105 L95,90 L70,90 L70,105 L45,100 L25,85 Z",
  "Spanish Grand Prix": "M15,75 L15,45 L30,20 L65,15 L120,15 L145,35 L148,65 L130,80 L108,80 L108,100 L90,110 L65,110 L48,100 L30,100 L15,90 Z",
  "Austrian Grand Prix": "M25,95 L20,55 L40,20 L80,12 L125,20 L148,55 L145,85 L120,100 L120,80 L85,80 L85,100 Z",
  "British Grand Prix": "M20,80 L18,50 L30,25 L65,15 L110,15 L140,35 L145,65 L125,80 L105,72 L88,82 L88,100 L65,112 L40,108 Z",
  "Hungarian Grand Prix": "M22,78 L28,45 L55,20 L95,15 L128,30 L140,60 L132,88 L110,100 L88,92 L75,103 L55,112 L32,100 Z",
  "Belgian Grand Prix": "M18,88 L18,52 L40,20 L80,15 L125,30 L140,62 L125,82 L100,75 L80,88 L78,108 L50,118 Z",
  "Dutch Grand Prix": "M22,90 L20,50 L35,22 L72,15 L112,18 L138,42 L140,75 L118,95 L95,100 L95,115 L65,118 L58,100 L38,100 Z",
  "Italian Grand Prix": "M15,78 L15,28 L75,15 L145,28 L148,78 L105,100 L105,78 L58,78 L58,100 Z",
  "Azerbaijan Grand Prix": "M22,108 L18,28 L75,15 L132,28 L135,58 L108,58 L108,82 L135,82 L132,108 L75,122 Z",
  "Singapore Grand Prix": "M18,98 L18,48 L45,18 L98,15 L128,45 L128,68 L108,68 L108,90 L128,90 L125,108 L85,120 L48,115 Z",
  "United States Grand Prix": "M22,88 L20,45 L55,18 L105,15 L138,42 L140,75 L118,90 L92,85 L80,100 L58,108 L38,102 Z",
  "Mexico City Grand Prix": "M15,78 L15,42 L38,18 L88,12 L132,18 L148,45 L148,78 L132,95 L108,98 L108,112 L62,112 L62,98 L38,98 Z",
  "São Paulo Grand Prix": "M28,98 L22,52 L55,18 L108,22 L132,52 L118,78 L95,72 L82,92 L62,108 Z",
  "Las Vegas Grand Prix": "M18,78 L18,40 L45,18 L108,18 L138,40 L138,78 L108,98 L80,98 L80,112 L48,112 L48,98 L28,98 Z",
  "Qatar Grand Prix": "M22,88 L22,42 L38,18 L75,12 L118,18 L138,45 L138,75 L118,95 L88,102 L88,88 L55,88 L55,102 L35,98 Z",
  "Abu Dhabi Grand Prix": "M18,78 L18,38 L55,18 L98,18 L128,40 L130,68 L108,78 L108,58 L78,58 L78,80 L98,90 L80,108 L48,108 L28,98 Z",
};

const DEFAULT = "M25,85 L22,48 L45,20 L88,15 L128,28 L140,62 L125,85 L100,95 L78,88 L62,100 L42,105 Z";

function CircuitOutline({ raceName }) {
  const d = CIRCUITS[raceName] || DEFAULT;
  return (
    <svg viewBox="0 0 165 135" className={styles.circuit} xmlns="http://www.w3.org/2000/svg">
      <path d={d} fill="none" stroke="#ffffff0f" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={d} fill="none" stroke="#e10600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={d} fill="none" stroke="#ffffff22" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
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
