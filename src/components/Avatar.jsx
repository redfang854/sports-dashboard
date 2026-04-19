import { useState } from "react";
import styles from "./Avatar.module.css";

/**
 * Shows an image if it loads successfully.
 * Falls back to coloured initials if the image 404s or is missing.
 */
export default function Avatar({ src, name, color = "#333", size = 48, shape = "circle" }) {
  const [failed, setFailed] = useState(false);

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const style = {
    width:  size,
    height: size,
    minWidth: size,
    borderRadius: shape === "circle" ? "50%" : 8,
    fontSize: Math.round(size * 0.33),
  };

  if (!src || failed) {
    return (
      <div
        className={styles.fallback}
        style={{ ...style, background: color + "22", borderColor: color + "55", color }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={styles.wrapper} style={style}>
      <img
        src={src}
        alt={name}
        className={styles.img}
        onError={() => setFailed(true)}
        draggable={false}
      />
    </div>
  );
}
