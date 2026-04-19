import { useState } from "react";
import MmaView from "./views/MmaView";
import F1View from "./views/F1View";
import styles from "./App.module.css";

const TABS = [
  { id: "mma", label: "UFC / MMA" },
  { id: "f1", label: "Formula 1" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("mma");

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <h1 className={styles.logo}>Scoreboard</h1>
            <span className={styles.tagline}>Live sports dashboard</span>
          </div>
          <nav className={styles.tabs} role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={styles.tab + (activeTab === tab.id ? " " + styles.tabActive : "")}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        {activeTab === "mma" ? <MmaView /> : <F1View />}
      </main>

      <footer className={styles.footer}>
        <p>Data: UFC · Formula 1 official sources · Built with React + Vite · Deployed on Vercel</p>
      </footer>
    </div>
  );
}
