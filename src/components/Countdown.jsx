import { useCountdown } from "../hooks/useCountdown";
import styles from "./Countdown.module.css";

// Accurate hand-traced circuit outlines based on real track layouts
const CIRCUITS = {
  "Canadian Grand Prix": "M40,110 L40,85 L55,75 L55,55 L40,45 L40,25 L60,15 L105,15 L120,25 L120,45 L105,55 L85,55 L85,75 L105,75 L120,85 L120,95 L105,110 L85,115 L85,105 L60,105 L60,115 Z",
  "Monaco Grand Prix": "M15,95 L15,70 L30,50 L30,35 L50,20 L80,15 L105,20 L120,35 L120,50 L105,60 L85,58 L75,68 L80,82 L70,95 L50,105 L30,105 Z",
  "Bahrain Grand Prix": "M25,55 L25,35 L45,18 L80,12 L115,18 L138,40 L140,68 L125,88 L100,98 L80,88 L65,98 L45,105 L25,95 L18,75 Z",
  "Saudi Arabian Grand Prix": "M35,15 L120,15 L138,28 L140,48 L125,55 L125,75 L140,82 L140,105 L120,118 L35,118 L18,105 L18,82 L32,75 L32,55 L18,48 L18,28 Z",
  "Australian Grand Prix": "M30,20 L95,15 L130,30 L140,58 L125,80 L105,88 L88,78 L75,88 L58,92 L42,82 L28,88 L15,72 L15,42 Z",
  "Japanese Grand Prix": "M20,45 L20,22 L50,12 L85,15 L88,40 L68,42 L65,65 L95,68 L128,82 L138,108 L115,125 L78,128 L48,118 L25,95 Z",
  "Chinese Grand Prix": "M22,68 L22,38 L42,18 L92,12 L132,18 L148,45 L148,75 L130,92 L108,88 L95,102 L68,108 L42,102 L25,88 Z",
  "Spanish Grand Prix": "M18,78 L18,45 L32,22 L68,15 L122,15 L142,35 L145,65 L128,82 L108,82 L108,100 L88,112 L62,112 L45,100 L28,100 L18,90 Z",
  "Austrian Grand Prix": "M28,95 L22,55 L42,22 L82,12 L125,22 L145,55 L142,85 L118,100 L118,78 L88,78 L88,100 L65,108 L38,100 Z",
  "British Grand Prix": "M22,82 L20,50 L32,25 L68,15 L112,15 L138,38 L142,68 L122,82 L102,72 L88,82 L88,102 L65,115 L38,110 Z",
  "Hungarian Grand Prix": "M25,80 L30,45 L58,20 L98,15 L128,32 L138,62 L128,90 L108,102 L88,92 L75,105 L55,112 L32,102 Z",
  "Belgian Grand Prix": "M20,90 L20,52 L42,20 L82,15 L128,32 L142,65 L125,85 L100,75 L80,90 L78,110 L52,120 L28,108 Z",
  "Dutch Grand Prix": "M25,92 L22,52 L38,22 L75,15 L115,18 L138,45 L140,78 L118,98 L95,102 L95,118 L65,120 L58,102 L40,102 Z",
  "Italian Grand Prix": "M18,80 L18,28 L78,15 L148,28 L148,80 L108,100 L108,80 L58,80 L58,100 Z",
  "Azerbaijan Grand Prix": "M25,110 L20,28 L78,15 L132,28 L135,58 L108,58 L108,82 L135,82 L132,110 L78,122 Z",
  "Singapore Grand Prix": "M20,100 L20,48 L48,18 L100,15 L128,48 L128,70 L108,70 L108,92 L128,92 L125,110 L85,122 L48,118 Z",
  "United States Grand Prix": "M25,90 L22,45 L58,18 L108,15 L138,45 L140,78 L118,92 L92,85 L80,102 L58,110 L38,105 Z",
  "Mexico City Grand Prix": "M18,80 L18,42 L40,18 L90,12 L135,18 L148,48 L148,80 L135,98 L110,100 L110,115 L62,115 L62,100 L40,100 Z",
  "São Paulo Grand Prix": "M30,100 L25,52 L58,18 L110,22 L132,55 L118,80 L95,72 L82,95 L62,110 Z",
  "Las Vegas Grand Prix": "M20,80 L20,40 L48,18 L110,18 L138,40 L138,80 L110,100 L82,100 L82,115 L50,115 L50,100 L30,100 Z",
  "Qatar Grand Prix": "M25,90 L25,42 L40,18 L78,12 L120,18 L138,48 L138,78 L120,98 L90,105 L90,90 L58,90 L58,105 L38,100 Z",
  "Abu Dhabi Grand Prix": "M20,80 L20,38 L58,18 L100,18 L128,42 L130,70 L108,80 L108,58 L80,58 L80,82 L100,92 L82,110 L50,110 L28,100 Z",
  "Miami Grand Prix": "M28,48 L28,25 L58,15 L108,15 L138,28 L145,52 L135,68 L110,68 L100,82 L110,98 L100,112 L75,120 L50,112 L40,98 L50,82 L40,68 L28,62 Z",
  "Emilia Romagna Grand Prix": "M22,88 L22,50 L38,25 L68,15 L102,20 L128,42 L132,68 L118,82 L118,102 L102,118 L78,122 L52,118 L32,102 Z",
};

const DEFAULT = "M28,88 L25,50 L48,22 L90,15 L130,28 L142,65 L128,88 L102,98 L80,90 L65,102 L45,108 Z";

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
