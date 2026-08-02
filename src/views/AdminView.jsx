import { useState, useEffect } from "react";
import styles from "./AdminView.module.css";

const PAGES = ["home", "football", "f1", "mma", "boxing", "rugby", "wrc"];

// Reads the Supabase session's access token directly out of localStorage
// instead of calling supabase.auth.getSession(), which was hanging
// indefinitely behind a stuck navigator.locks lock
// ("lock:sb-<project-ref>-auth-token"). This is a synchronous read -
// it cannot hang, because it never touches the lock at all.
function getStoredAccessToken() {
  const key = Object.keys(localStorage).find(
    (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
  );
  if (!key) throw new Error("Not signed in (no stored session found)");

  let parsed;
  try {
    parsed = JSON.parse(localStorage.getItem(key));
  } catch {
    throw new Error("Not signed in (stored session unreadable)");
  }

  const token = parsed?.access_token || parsed?.currentSession?.access_token;
  if (!token) throw new Error("Not signed in (no access token in stored session)");

  const expiresAt = parsed?.expires_at;
  if (expiresAt && Date.now() / 1000 > expiresAt) {
    throw new Error("Session expired — please sign out and back in");
  }

  return token;
}

export default function AdminView() {
  const [pageKey, setPageKey] = useState("football");
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", image_url: "", cta_label: "", cta_link: "" });
  const [recap, setRecap] = useState("");
  const [story, setStory] = useState({ title: "", body: "", image_url: "" });
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function load() {
      setStatus("Loading...");
      try {
        const heroRes = await fetch(`/api/hero?page=${pageKey}`);
        if (heroRes.ok) {
          const data = await heroRes.json();
          setForm({
            title: data.title || "",
            subtitle: data.subtitle || "",
            image_url: data.image_url || "",
            cta_label: data.cta_label || "",
            cta_link: data.cta_link || "",
          });
        } else {
          setForm({ title: "", subtitle: "", image_url: "", cta_label: "", cta_link: "" });
        }

        const recapRes = await fetch(`/api/page-content?page=${pageKey}&section=season_recap`);
        if (recapRes.ok) {
          const data = await recapRes.json();
          setRecap(data.content || "");
        } else {
          setRecap("");
        }

        const [titleRes, bodyRes, imageRes] = await Promise.all([
          fetch(`/api/page-content?page=${pageKey}&section=story_title`),
          fetch(`/api/page-content?page=${pageKey}&section=story_body`),
          fetch(`/api/page-content?page=${pageKey}&section=story_image_url`),
        ]);
        setStory({
          title: titleRes.ok ? (await titleRes.json()).content || "" : "",
          body: bodyRes.ok ? (await bodyRes.json()).content || "" : "",
          image_url: imageRes.ok ? (await imageRes.json()).content || "" : "",
        });

        setStatus("");
      } catch (err) {
        setStatus(`Error loading: ${err.message}`);
      }
    }
    load();
  }, [pageKey]);

  function getAuthHeader() {
    const token = getStoredAccessToken();
    return { Authorization: `Bearer ${token}` };
  }

  async function saveHero() {
    setStatus("Saving hero...");
    try {
      const authHeader = getAuthHeader();
      const res = await fetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ page_key: pageKey, ...form }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      setStatus("Hero saved.");
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  }

  async function saveRecap() {
    setStatus("Saving recap...");
    try {
      const authHeader = getAuthHeader();
      const res = await fetch("/api/page-content", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ page_key: pageKey, section_key: "season_recap", content: recap }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      setStatus("Recap saved.");
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  }

  async function saveStorySection(sectionKey, content) {
    const authHeader = getAuthHeader();
    const res = await fetch("/api/page-content", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ page_key: pageKey, section_key: sectionKey, content }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Save failed");
  }

  async function saveStory() {
    setStatus("Saving story...");
    try {
      await saveStorySection("story_title", story.title);
      await saveStorySection("story_body", story.body);
      await saveStorySection("story_image_url", story.image_url);
      setStatus("Story saved.");
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus("Uploading image...");
    try {
      const authHeader = getAuthHeader();
      const data_base64 = await readFileAsBase64(file);

      const res = await fetch("/api/upload-story-image", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          page_key: pageKey,
          filename: file.name,
          content_type: file.type,
          data_base64,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload failed");

      setStory((s) => ({ ...s, image_url: result.url }));
      setStatus("Image uploaded — remember to click Save Story.");
    } catch (err) {
      setStatus(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className={styles.admin}>
      <h2>CMS — Hero, Season Recap & Story</h2>

      <label className={styles.label}>Page</label>
      <div className={styles.selectWrap}>
        <button
          type="button"
          className={styles.selectButton}
          onClick={() => setPageMenuOpen((o) => !o)}
        >
          {pageKey} <span className={styles.selectCaret}>&#9662;</span>
        </button>
        {pageMenuOpen && (
          <div className={styles.selectMenu}>
            {PAGES.map((p) => (
              <div
                key={p}
                className={styles.selectOption}
                onClick={() => { setPageKey(p); setPageMenuOpen(false); }}
              >
                {p}
              </div>
            ))}
          </div>
        )}
      </div>

      <h3>Hero Section</h3>
      <label className={styles.label}>Title</label>
      <input className={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

      <label className={styles.label}>Subtitle</label>
      <input className={styles.input} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />

      <label className={styles.label}>Image URL</label>
      <input className={styles.input} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />

      <label className={styles.label}>CTA Label</label>
      <input className={styles.input} value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} />

      <label className={styles.label}>CTA Link</label>
      <input className={styles.input} value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} />

      <button className={styles.saveBtn} onClick={saveHero}>Save Hero</button>

      <h3>Season Recap</h3>
      <textarea className={styles.textarea} rows={5} value={recap} onChange={(e) => setRecap(e.target.value)} />
      <button className={styles.saveBtn} onClick={saveRecap}>Save Recap</button>

      <h3>Story Page ({pageKey}/story)</h3>
      <label className={styles.label}>Story Title</label>
      <input className={styles.input} value={story.title} onChange={(e) => setStory({ ...story, title: e.target.value })} />

      <label className={styles.label}>Story Body (one paragraph per line)</label>
      <textarea className={styles.textarea} rows={8} value={story.body} onChange={(e) => setStory({ ...story, body: e.target.value })} />

      <label className={styles.label}>Featured Image</label>
      <input className={styles.input} value={story.image_url} onChange={(e) => setStory({ ...story, image_url: e.target.value })} placeholder="Uploaded image URL appears here" />
      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ marginTop: 8 }} />
      {story.image_url && (
        <img src={story.image_url} alt="Story preview" style={{ maxWidth: "100%", maxHeight: 160, marginTop: 10, borderRadius: 8, display: "block" }} />
      )}

      <button className={styles.saveBtn} onClick={saveStory} disabled={uploading}>Save Story</button>

      {status && <p className={styles.status}>{status}</p>}
    </div>
  );
}
