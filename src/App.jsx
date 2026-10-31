import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import MmaView      from "./views/MmaView";
import F1View       from "./views/F1View";
import FootballView from "./views/FootballView";
import BoxingView   from "./views/BoxingView";
import RugbyView    from "./views/RugbyView";
import WrcView      from "./views/WrcView";
import LoadingScreen from "./components/LoadingScreen";
import AdminLogin   from "./components/AdminLogin";
import styles from "./App.module.css";
import AdminView from "./views/AdminView";

const TABS = [
  { id: "football", label: "Football" },
  { id: "f1",       label: "Formula 1" },
  { id: "mma",      label: "MMA" },
  { id: "boxing",   label: "Boxing" },
  { id: "rugby",    label: "Rugby" },
  { id: "wrc",      label: "WRC" },
];

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const onAdminRoute = location.pathname.replace(/\/+$/, "") === "/admin";
  const isAdmin = !!user && !!ADMIN_EMAIL && user.email === ADMIN_EMAIL;
  const [activeTab,  setActiveTab]  = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return TABS.some((t) => t.id === hash) ? hash : "football";
  });
  const [loaded,     setLoaded]     = useState(false);

  const handleDone = useCallback(() => setLoaded(true), []);

  // The Admin tab lives at /admin; sport tabs live at /. The route decides
  // which one is showing, so there is no state to keep in sync.
  const currentTab = onAdminRoute ? "admin" : activeTab;

  function selectTab(id) {
    if (id === "admin") { navigate("/admin"); return; }
    setActiveTab(id);
    if (onAdminRoute) navigate("/");
  }

  const showAdminLogin = onAdminRoute && !isAdmin && !authLoading;

  return (
    <>
      {!loaded && <LoadingScreen onDone={handleDone} />}

      <div className={styles.app} style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.4s ease" }}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.topRow}>
              {/* Logo */}
              <div className={styles.brand}>
                <div className={styles.logoMark}>
                  <span className={styles.logoA}>A</span>
                  <span className={styles.logoPEX}>PEX</span>
                  <div className={styles.logoBar} />
                </div>
                <span className={styles.tagline}>Your edge in every sport</span>
              </div>

              {/* Admin session controls — only visible to the signed-in admin */}
              {isAdmin && (
                <div className={styles.authArea}>
                  <div className={styles.userRow}>
                    <span className={styles.userName}>Admin</span>
                    <button className={styles.signOutBtn} onClick={signOut}>Sign out</button>
                  </div>
                </div>
              )}
            </div>

            {/* Sport tabs */}
            <nav className={styles.tabs} role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={currentTab === tab.id}
                  className={`${styles.tab} ${currentTab === tab.id ? styles.tabActive : ""}`}
                  onClick={() => selectTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
              {isAdmin && (
                <button
                  role="tab"
                  aria-selected={currentTab === "admin"}
                  className={`${styles.tab} ${currentTab === "admin" ? styles.tabActive : ""}`}
                  onClick={() => selectTab("admin")}
                >
                  Admin
                </button>
              )}
            </nav>
          </div>
        </header>

        <main className={styles.main}>
          {showAdminLogin ? <AdminLogin adminEmail={ADMIN_EMAIL} /> : <>
          {currentTab === "football" && <FootballView />}
          {currentTab === "f1"       && <F1View />}
          {currentTab === "mma"      && <MmaView />}
          {currentTab === "boxing"   && <BoxingView />}
          {currentTab === "rugby"    && <RugbyView />}
          {currentTab === "wrc"      && <WrcView />}
          {currentTab === "admin"    && isAdmin && <AdminView />}
          </>}
        </main>

        <footer className={styles.footer}>
          <p>APEX · Live data: Formula 1 via Jolpica · Football via football-data.org · API-Football · Built with React + Vite · Deployed on Vercel</p>
        </footer>
      </div>

    </>
  );
}
