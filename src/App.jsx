import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoadingScreen from "./components/LoadingScreen";
import AdminLogin   from "./components/AdminLogin";
import { LoadingState } from "./components/StatusStates";
import styles from "./App.module.css";

// Each tab is its own JS chunk, loaded the first time it's opened, so the
// initial download is the shell plus one sport instead of all six + admin.
const FootballView = lazy(() => import("./views/FootballView"));
const F1View       = lazy(() => import("./views/F1View"));
const MmaView      = lazy(() => import("./views/MmaView"));
const BoxingView   = lazy(() => import("./views/BoxingView"));
const RugbyView    = lazy(() => import("./views/RugbyView"));
const WrcView      = lazy(() => import("./views/WrcView"));
const AdminView    = lazy(() => import("./views/AdminView"));
const AboutView    = lazy(() => import("./views/AboutView"));

const TABS = [
  { id: "football", label: "Football" },
  { id: "f1",       label: "Formula 1" },
  { id: "mma",      label: "MMA" },
  { id: "boxing",   label: "Boxing" },
  { id: "rugby",    label: "Rugby" },
  { id: "wrc",      label: "WRC" },
];

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const INTRO_KEY = "apex:intro-seen";

// "/f1" -> "f1"; "/admin" -> "admin"; "/" or unknown -> legacy "#boxing"
// hash links still work, otherwise Football.
function tabFromLocation({ pathname, hash }) {
  const segment = pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  if (segment === "admin" || segment === "about") return segment;
  if (TABS.some((t) => t.id === segment)) return segment;
  const fromHash = hash.replace("#", "");
  return TABS.some((t) => t.id === fromHash) ? fromHash : "football";
}

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = !!user && !!ADMIN_EMAIL && user.email === ADMIN_EMAIL;
  // Intro animation plays once per browser session, so a reload drops the
  // visitor straight back onto the page they were on.
  const [loaded, setLoaded] = useState(() => {
    try { return sessionStorage.getItem(INTRO_KEY) === "1"; } catch { return false; }
  });
  const handleDone = useCallback(() => {
    try { sessionStorage.setItem(INTRO_KEY, "1"); } catch { /* private mode: just replay next time */ }
    setLoaded(true);
  }, []);

  // The tab row scrolls sideways on narrow screens with its scrollbar
  // hidden; track which edges have more tabs so CSS can fade them as a hint.
  const tabsRef = useRef(null);
  const [tabEdges, setTabEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const update = () => setTabEdges({
      left:  el.scrollLeft > 2,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
    if (observer) observer.observe(el); else update();
    el.addEventListener("scroll", update, { passive: true });
    return () => { observer?.disconnect(); el.removeEventListener("scroll", update); };
  }, []);

  // Every tab has its own URL (/football, /f1, ..., /admin), so reloading,
  // bookmarking, sharing and Back/Forward all keep the current tab. The URL
  // is the single source of truth: no tab state to keep in sync.
  const currentTab = tabFromLocation(location);

  useEffect(() => {
    const label = currentTab === "admin" ? "Admin" : currentTab === "about" ? "About" : TABS.find((t) => t.id === currentTab)?.label;
    document.title = label ? `${label} · Apex` : "Apex — Your Edge in Every Sport";
  }, [currentTab]);

  function selectTab(id, target) {
    target?.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: "smooth" });
    if (id !== currentTab) navigate(`/${id}`);
  }

  const showAdminLogin = currentTab === "admin" && !isAdmin && !authLoading;

  return (
    <>
      {!loaded && <LoadingScreen onDone={handleDone} />}

      <div className={styles.app} style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.25s ease" }}>
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
            <nav
              ref={tabsRef}
              className={`${styles.tabs} ${tabEdges.left ? styles.fadeLeft : ""} ${tabEdges.right ? styles.fadeRight : ""}`}
              role="tablist"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={currentTab === tab.id}
                  className={`${styles.tab} ${currentTab === tab.id ? styles.tabActive : ""}`}
                  onClick={(e) => selectTab(tab.id, e.currentTarget)}
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
          {showAdminLogin ? <AdminLogin adminEmail={ADMIN_EMAIL} /> : <Suspense fallback={<LoadingState message="Loading…" />}>
          {currentTab === "football" && <FootballView />}
          {currentTab === "f1"       && <F1View />}
          {currentTab === "mma"      && <MmaView />}
          {currentTab === "boxing"   && <BoxingView />}
          {currentTab === "rugby"    && <RugbyView />}
          {currentTab === "wrc"      && <WrcView />}
          {currentTab === "admin"    && isAdmin && <AdminView />}
          {currentTab === "about"    && <AboutView />}
          </Suspense>}
        </main>

        <footer className={styles.footer}>
          <p>
            Built by <a href="https://sudo-hinga.hingabrayo.workers.dev" target="_blank" rel="noopener noreferrer">Brian Hinga</a>
            {" · "}<a href="https://github.com/redfang854/sports-dashboard" target="_blank" rel="noopener noreferrer">Source on GitHub</a>
            {" · "}<a href="/about" onClick={(e) => { e.preventDefault(); navigate("/about"); window.scrollTo(0, 0); }}>About &amp; data credits</a>
          </p>
          <p className={styles.footerSub}>
            Data: Jolpica F1, football-data.org, API-Football, CitoAPI, TheSportsDB, BBC Sport &amp; Autosport RSS, Wikipedia (CC BY-SA 4.0). Not affiliated with any league or team.
          </p>
        </footer>
      </div>

    </>
  );
}
