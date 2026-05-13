"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

function ChatApp() {
  const router = useRouter();
  const params = useSearchParams();
  const isGuest = params.get("guest") === "true";
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("guest");
  const [sessions, setSessions] = useState([{ id: "default", title: "new chat", messages: [] }]);
  const [activeSession, setActiveSession] = useState("default");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const currentSession = sessions.find(s => s.id === activeSession);
  const messages = currentSession?.messages || [];

  useEffect(() => {
    if (!isGuest) {
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) { router.push("/"); return; }
        setUser(data.user);
        setUsername(data.user.user_metadata?.username || data.user.email?.split("@")[0] || "user");
      });
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function newChat() {
    const id = Date.now().toString();
    setSessions(prev => [{ id, title: "new chat", messages: [] }, ...prev]);
    setActiveSession(id);
    setSidebarOpen(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");

    const userMsg = { role: "user", content: text, ts: Date.now() };
    setSessions(prev => prev.map(s =>
      s.id === activeSession
        ? { ...s, title: s.messages.length === 0 ? text.slice(0, 32) : s.title, messages: [...s.messages, userMsg] }
        : s
    ));
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const aiMsg = {
        role: "assistant",
        content: data.response || data.error || "something went wrong.",
        tier: data.tier,
        workerCount: data.workerCount,
        ts: Date.now(),
      };
      setSessions(prev => prev.map(s =>
        s.id === activeSession
          ? { ...s, messages: [...s.messages, aiMsg] }
          : s
      ));
    } catch {
      setSessions(prev => prev.map(s =>
        s.id === activeSession
          ? { ...s, messages: [...s.messages, { role: "assistant", content: "pipeline error. try again.", ts: Date.now() }] }
          : s
      ));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const tierLabel = (tier, count) => tier ? `tier ${tier} · ${count} worker${count !== 1 ? "s" : ""}` : null;

  return (
    <div style={c.layout}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div style={c.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div style={{ ...c.sidebar, ...(sidebarOpen ? c.sidebarOpen : {}) }}>
        <div style={c.sidebarHeader}>
          <span style={c.sidebarLogo}>openvoxels.</span>
          <button style={c.newChatBtn} onClick={newChat} title="new chat">+</button>
        </div>

        <div style={c.sessionList}>
          {sessions.map(s => (
            <div
              key={s.id}
              style={{ ...c.sessionItem, ...(s.id === activeSession ? c.sessionActive : {}) }}
              onClick={() => { setActiveSession(s.id); setSidebarOpen(false); }}
            >
              <span style={c.sessionIcon}>$</span>
              <span style={c.sessionTitle}>{s.title}</span>
            </div>
          ))}
        </div>

        <div style={c.sidebarFooter}>
          {isGuest && <button style={c.signInPrompt} onClick={() => router.push("/")}>sign in →</button>}
          <div style={c.sidebarMeta}>
            <span style={c.metaText}>5 workers · 3 super AIs</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div style={c.chatArea}>
        {/* Top bar */}
        <div style={c.topBar}>
          <button style={c.sidebarToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div style={c.topBarLeft}>
            <span style={c.topBarPrompt}>[{username}@openvoxels]</span>
          </div>
          <div style={c.topBarRight}>
            {loading && (
              <div style={c.loadingIndicator}>
                {[0, 1, 2].map(i => <span key={i} style={{ ...c.loadDot, animationDelay: `${i * 0.2}s` }} />)}
              </div>
            )}
            <div style={c.accountBtn} onClick={() => setShowMenu(m => !m)}>
              <span style={c.accountInitial}>{username[0].toUpperCase()}</span>
            </div>
            {showMenu && (
              <div style={c.menu} onClick={() => setShowMenu(false)}>
                <div style={c.menuHeader}>
                  <div style={c.menuName}>{username}</div>
                  {!isGuest && <div style={c.menuEmail}>{user?.email}</div>}
                </div>
                <div style={c.menuDivider} />
                <button style={c.menuItem} onClick={() => { setShowSettings(true); setShowMenu(false); }}>settings</button>
                <button style={c.menuItem} onClick={() => { newChat(); setShowMenu(false); }}>new chat</button>
                <div style={c.menuDivider} />
                {isGuest
                  ? <button style={c.menuItem} onClick={() => router.push("/")}>sign in</button>
                  : <button style={{ ...c.menuItem, color: "#c0392b" }} onClick={signOut}>sign out</button>
                }
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={c.messages}>
          {messages.length === 0 && (
            <div style={c.empty}>
              <div style={c.emptyLogo}>openvoxels.</div>
              <div style={c.emptyText}>synthesis ensemble</div>
              <div style={c.emptyHints}>
                {["ask anything", "five minds", "one answer"].map(h => (
                  <span key={h} style={c.emptyHint}>{h}</span>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={c.msgRow}>
              {msg.role === "user" ? (
                <div style={c.userLine}>
                  <span style={c.userPrompt}>[{username}@openvoxels]:</span>
                  <span style={c.userText}> {msg.content}</span>
                </div>
              ) : (
                <div style={c.aiBlock}>
                  <div style={c.aiLabel}>openvoxels:</div>
                  <div style={c.aiText}>{msg.content}</div>
                  {msg.tier && <div style={c.tierTag}>{tierLabel(msg.tier, msg.workerCount)}</div>}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={c.msgRow}>
              <div style={c.aiBlock}>
                <div style={c.aiLabel}>openvoxels:</div>
                <div style={c.thinkingRow}>
                  {[0, 1, 2].map(i => <span key={i} style={{ ...c.thinkDot, animationDelay: `${i * 0.15}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={c.inputBar}>
          <div style={c.inputPrompt}>[{username}@openvoxels]:</div>
          <textarea
            ref={inputRef}
            style={c.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="type..."
            rows={1}
            disabled={loading}
          />
          <button style={{ ...c.sendBtn, opacity: loading || !input.trim() ? 0.25 : 1 }} onClick={sendMessage} disabled={loading || !input.trim()}>
            ↵
          </button>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div style={c.overlay} onClick={() => setShowSettings(false)}>
          <div style={c.settingsModal} onClick={e => e.stopPropagation()}>
            <div style={c.modalHdr}>
              <span>settings</span>
              <button style={c.modalCloseBtn} onClick={() => setShowSettings(false)}>✕</button>
            </div>
            {[["account", isGuest ? "guest" : username], ["workers", "5 models"], ["super AIs", "3 layers"], ["version", "v1.0"]].map(([label, val]) => (
              <div key={label} style={c.settingRow}>
                <span style={c.settingLabel}>{label}</span>
                <span style={c.settingVal}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatApp />
    </Suspense>
  );
}

const c = {
  layout: { display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)", position: "relative" },
  sidebarOverlay: {
    display: "none",
    "@media (max-width: 768px)": {
      display: "block",
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 5,
    },
  },
  sidebar: {
    width: "240px",
    minWidth: "240px",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    background: "var(--surface)",
    "@media (max-width: 768px)": {
      position: "fixed",
      left: 0,
      top: 0,
      height: "100vh",
      width: "240px",
      zIndex: 10,
      transform: "translateX(-100%)",
      transition: "transform 0.3s ease",
    },
  },
  sidebarOpen: {
    "@media (max-width: 768px)": {
      transform: "translateX(0)",
    },
  },
  sidebarHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 16px", borderBottom: "1px solid var(--border)" },
  sidebarLogo: { fontSize: "13px", fontWeight: "700", color: "#d0d0d0" },
  newChatBtn: { background: "none", border: "1px solid var(--border2)", color: "var(--text-dim)", fontFamily: "var(--font)", fontSize: "16px", width: "26px", height: "26px", cursor: "pointer", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center" },
  sessionList: { flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "2px" },
  sessionItem: { display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "3px", cursor: "pointer", color: "var(--text-dim)", fontSize: "12px" },
  sessionActive: { background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" },
  sessionIcon: { color: "var(--green)", fontSize: "11px", flexShrink: 0 },
  sessionTitle: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 },
  sidebarFooter: { padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "8px" },
  signInPrompt: { background: "none", border: "none", color: "var(--green)", fontFamily: "var(--font)", fontSize: "11px", cursor: "pointer", textAlign: "left", padding: 0 },
  sidebarMeta: {},
  metaText: { fontSize: "10px", color: "var(--text-muted)" },
  chatArea: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", gap: "12px", "@media (max-width: 768px)": { padding: "12px 16px", gap: "8px" } },
  sidebarToggle: { display: "none", background: "none", border: "none", color: "var(--text)", fontFamily: "var(--font)", fontSize: "16px", cursor: "pointer", "@media (max-width: 768px)": { display: "block" } },
  topBarLeft: { flex: 1, minWidth: 0 },
  topBarPrompt: { fontSize: "12px", color: "var(--green)", "@media (max-width: 600px)": { fontSize: "11px" } },
  topBarRight: { display: "flex", alignItems: "center", gap: "12px", position: "relative" },
  loadingIndicator: { display: "flex", alignItems: "center", gap: "5px" },
  loadDot: { width: "5px", height: "5px", borderRadius: "50%", background: "var(--green)", display: "block", animation: "pulse 1s ease-in-out infinite" },
  accountBtn: { width: "30px", height: "30px", borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },
  accountInitial: { fontSize: "12px", color: "var(--text)", fontWeight: "600" },
  menu: { position: "absolute", top: "40px", right: 0, background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: "4px", width: "200px", zIndex: 100, overflow: "hidden", animation: "fadeUp 0.15s ease" },
  menuHeader: { padding: "12px 14px" },
  menuName: { fontSize: "13px", color: "var(--text)", fontWeight: "500" },
  menuEmail: { fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" },
  menuDivider: { height: "1px", background: "var(--border)", margin: "4px 0" },
  menuItem: { display: "block", width: "100%", background: "none", border: "none", color: "var(--text-dim)", fontFamily: "var(--font)", fontSize: "12px", padding: "9px 14px", cursor: "pointer", textAlign: "left" },
  messages: { flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", "@media (max-width: 768px)": { padding: "16px 16px" } },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "10px", marginTop: "60px", animation: "fadeIn 0.4s ease" },
  emptyLogo: { fontSize: "24px", fontWeight: "700", color: "#2a2a2a" },
  emptyText: { fontSize: "12px", color: "var(--text-muted)" },
  emptyHints: { display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" },
  emptyHint: { fontSize: "10px", color: "var(--text-muted)", border: "1px solid var(--border)", padding: "3px 8px", borderRadius: "2px" },
  msgRow: { animation: "fadeUp 0.2s ease" },
  userLine: { fontSize: "13px", lineHeight: 1.6 },
  userPrompt: { color: "var(--green)", fontWeight: "500" },
  userText: { color: "#e0e0e0" },
  aiBlock: { display: "flex", flexDirection: "column", gap: "6px" },
  aiLabel: { fontSize: "11px", color: "var(--text-muted)" },
  aiText: { fontSize: "13px", color: "var(--text)", lineHeight: 1.8, whiteSpace: "pre-wrap", maxWidth: "100%", "@media (max-width: 768px)": { fontSize: "12px" } },
  tierTag: { fontSize: "10px", color: "var(--green)", opacity: 0.7, letterSpacing: "0.05em" },
  thinkingRow: { display: "flex", alignItems: "center", gap: "5px" },
  thinkDot: { width: "5px", height: "5px", borderRadius: "50%", background: "var(--text-muted)", display: "block", animation: "pulse 1s ease-in-out infinite" },
  inputBar: { display: "flex", alignItems: "flex-end", gap: "10px", padding: "16px 24px 20px", borderTop: "1px solid var(--border)", background: "var(--surface)", "@media (max-width: 768px)": { padding: "12px 16px 16px", gap: "8px" } },
  inputPrompt: { fontSize: "12px", color: "var(--green)", paddingBottom: "10px", flexShrink: 0, whiteSpace: "nowrap", "@media (max-width: 768px)": { display: "none" } },
  input: { flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "3px", color: "var(--text)", fontFamily: "var(--font)", fontSize: "13px", padding: "10px 14px", resize: "none", outline: "none", lineHeight: 1.5, minHeight: "42px", maxHeight: "160px" },
  sendBtn: { background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text)", fontFamily: "var(--font)", fontSize: "16px", width: "42px", height: "42px", cursor: "pointer", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", padding: "16px" },
  settingsModal: { background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: "6px", padding: "20px", width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", gap: "4px", animation: "fadeUp 0.2s ease" },
  modalHdr: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", fontSize: "14px", fontWeight: "600", color: "#d0d0d0" },
  modalCloseBtn: { background: "none", border: "none", color: "var(--text-dim)", fontFamily: "var(--font)", fontSize: "14px", cursor: "pointer" },
  settingRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" },
  settingLabel: { fontSize: "12px", color: "var(--text-dim)" },
  settingVal: { fontSize: "12px", color: "var(--text)" },
};
