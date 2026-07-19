import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import styles from "./AdminView.module.css";

const PAGES = ["home", "football", "f1", "mma", "boxing", "rugby", "wrc"];

export default function AdminView() {
  const [pageKey, setPageKey] = useState("football");
  const [form, setForm] = useState({ title: "", subtitle: "", image_url: "", cta_label: "", cta_link: "" });
  const [recap, setRecap] = useState("");
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
        setStatus("");
      } catch (err) {
        setStatus(`Error loading: ${err.message}`);
      }
    }
    load();
  }, [pageKey]);

  async function getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not signed in");
    return { Authorization: `Bearer ${session.access_token}` };
  }

  async function saveHero() {
    setStatus("Saving hero...");
    try {
      const authHeader = await getAuthHeader();
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
      const authHeader = await getAuthHeader();
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

  return (
    <div className={styles.admin}>
      <h2>CMS — Hero & Season Recap</h2>

      <label className={styles.label}>Page</label>
      <select className={styles.input} value={pageKey} onChange={(e) => setPageKey(e.target.value)}>
        {PAGES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

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

      {status && <p className={styles.status}>{status}</p>}
    </div>
  );
}
