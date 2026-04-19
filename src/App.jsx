import { useState, useCallback } from "react";
import MmaView      from "./views/MmaView";
import F1View       from "./views/F1View";
import FootballView from "./views/FootballView";
import BoxingView   from "./views/BoxingView";
import RugbyView    from "./views/RugbyView";
import WrcView      from "./views/WrcView";
import LoadingScreen from "./components/LoadingScreen";
import styles from "./App.module.css";

const TABS = [
  { id: "football", label: "⚽ Football" },
  { id: "f1",       label: "🏎️ Formula 1" },
  { id: "mma",      label: "🥋 MMA" },
  { id: "boxing",   label: "🥊 Boxing" },
  { id: "rugby",    label: "🏉 Rugby" },
  { id: "wrc",      label: "🚗 WRC" },
];

export default function App() {
  const [activeTab,  setActiveTab]  = useState("football");
  const [loaded,     setLoaded]     = useState(false);

  const handleDone = useCallback(() => setLoaded(true), []);

  return (
    <>
      {!loaded && <LoadingScreen onDone={handleDone} />}

      <div className={styles.app} style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.4s ease" }}>
        <header className={styles.header}>
          <div className={styles.headerInner}>

            {/* Logo */}
            <div className={styles.brand}>
              <div className={styles.logoMark}>
                <span className={styles.logoA}>A</span>
                <span className={styles.logoPEX}>PEX</span>
                <div className={styles.logoBar} />
              </div>
              <span className={styles.tagline}>Your edge in every sport</span>
            </div>

            {/* Sport tabs */}
            <nav className={styles.tabs} role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className={styles.main}>
          {activeTab === "football" && <FootballView />}
          {activeTab === "f1"       && <F1View />}
          {activeTab === "mma"      && <MmaView />}
          {activeTab === "boxing"   && <BoxingView />}
          {activeTab === "rugby"    && <RugbyView />}
          {activeTab === "wrc"      && <WrcView />}
        </main>

        <footer className={styles.footer}>
          <p>APEX · Live data: Formula 1 via Jolpica · Football via football-data.org · Built with React + Vite · Deployed on Vercel</p>
        </footer>
      </div>
    </>
  );
}
