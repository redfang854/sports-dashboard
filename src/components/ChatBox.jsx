import { useState, useEffect, useRef } from "react";
import { supabase, supabaseReady } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import styles from "./ChatBox.module.css";

export default function ChatBox() {
  const { user, profile } = useAuth();
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [online,   setOnline]   = useState([]);
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (!open || !supabaseReady) return;
    supabase.from("messages").select("*, profiles(username)")
      .order("created_at", { ascending: true }).limit(60)
      .then(({ data }) => setMessages(data || []));

    const channel = supabase.channel("global-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const { data: p } = await supabase.from("profiles").select("username").eq("id", payload.new.user_id).single();
          setMessages((prev) => [...prev, { ...payload.new, profiles: p }]);
        }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [open]);

  useEffect(() => {
    console.log("PRESENCE EFFECT:", { user, profile, supabaseReady });
    if (!user || !profile || !supabaseReady) return;
    const presence = supabase.channel("online-users", { config: { presence: { key: user.id } } });
    presence.on("presence", { event: "sync" }, () => {
      const state = presence.presenceState();
      console.log("SYNC:", state);
      setOnline(Object.values(state).flat());
    }).on("presence", { event: "join" }, () => {
      setOnline(Object.values(presence.presenceState()).flat());
    }).on("presence", { event: "leave" }, () => {
      setOnline(Object.values(presence.presenceState()).flat());
    }).subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await presence.track({ user_id: user.id, username: profile.username });
        setTimeout(() => {
          const state = presence.presenceState();
          console.log("PRESENCE STATE:", state);
          setOnline(Object.values(state).flat());
        }, 500);
      }
    });
    return () => supabase.removeChannel(presence);
  }, [user, profile]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open && user) setTimeout(() => inputRef.current?.focus(), 100); }, [open, user]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !user || sending || !supabaseReady) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    await supabase.from("messages").insert({ user_id: user.id, content: text });
    setSending(false);
  }

  const username = profile?.username || user?.email?.split("@")[0] || "You";
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className={styles.container}>
      <button className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`} onClick={() => setOpen(!open)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Chats</span>
        {online.length > 0 && <span className={styles.onlineCount}>{online.length}</span>}
        <svg className={`${styles.chevron} ${open ? styles.chevronUp : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.onlineSection}>
            <p className={styles.sectionLabel}><span className={styles.onlineDot} />{online.length} online now</p>
            <div className={styles.onlineList}>
              {online.length === 0 && <p className={styles.emptyOnline}>No one else online yet</p>}
              {online.map((u) => (
                <div key={u.user_id} className={styles.onlineUser}>
                  <div className={styles.userAvatar}>{u.username?.slice(0, 2).toUpperCase()}</div>
                  <span className={styles.onlineUsername}>{u.username}</span>
                  {u.user_id === user?.id && <span className={styles.youBadge}>you</span>}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.messages}>
            {messages.length === 0 && <p className={styles.emptyMsg}>{user ? "No messages yet — say hello! 👋" : "Sign in to join the conversation"}</p>}
            {messages.map((msg) => {
              const isMe = msg.user_id === user?.id;
              const name = msg.profiles?.username || "User";
              return (
                <div key={msg.id} className={`${styles.msgRow} ${isMe ? styles.msgRowMe : ""}`}>
                  {!isMe && <div className={styles.msgAvatar}>{name.slice(0, 2).toUpperCase()}</div>}
                  <div className={styles.msgContent}>
                    {!isMe && <span className={styles.msgName}>{name}</span>}
                    <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : ""}`}>{msg.content}</div>
                    <span className={`${styles.msgTime} ${isMe ? styles.msgTimeMe : ""}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {isMe && <div className={`${styles.msgAvatar} ${styles.msgAvatarMe}`}>{initials}</div>}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          {user ? (
            <form className={styles.inputRow} onSubmit={sendMessage}>
              <input ref={inputRef} className={styles.chatInput} placeholder="Message everyone..." value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} />
              <button className={styles.sendBtn} type="submit" disabled={!input.trim() || sending}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          ) : (
            <div className={styles.signInPrompt}>Sign in to chat with other fans</div>
          )}
        </div>
      )}
    </div>
  );
}
