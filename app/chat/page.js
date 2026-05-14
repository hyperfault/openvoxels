"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AVAILABLE_WORKERS, DEFAULT_WORKERS } from "@/lib/workers";
import { AVAILABLE_SUPER_MODELS, DEFAULT_SUPER_MODELS } from "@/lib/superais";

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
  const [showAiConfig, setShowAiConfig] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // AI config state
  const [selectedWorkers, setSelectedWorkers] = useState([...DEFAULT_WORKERS]);
  const [workerCount, setWorkerCount] = useState("auto");
  const [superModels, setSuperModels] = useState({ ...DEFAULT_SUPER_MODELS });

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

  function resetAiConfig() {
    setSelectedWorkers([...DEFAULT_WORKERS]);
    setWorkerCount("auto");
    setSuperModels({ ...DEFAULT_SUPER_MODELS });
  }

  function toggleWorker(modelId) {
    setSelectedWorkers(prev =>
    prev.includes(modelId)
    ? prev.filter(id => id !== modelId)
    : [...prev, modelId]
    );
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
        body: JSON.stringify({
          message: text,
          workerCountOverride: workerCount === "auto" ? null : workerCount,
          workerModels: selectedWorkers,
          superAiModels: superModels,
        }),
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
      s.id === activeSession ? { ...s, messages: [...s.messages, aiMsg] } : s
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
    {sidebarOpen && <div style={c.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

    {/* Sidebar */}
    <div style={{ ...c.sidebar, ...(sidebarOpen ? c.sidebarVisible : {}) }}>
    <div style={c.sidebarHeader}>
    <span style={c.sidebarLogo}>openvoxels.</span>
    <button style={c.newChatBtn} onClick={newChat}>+</button>
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
    {isGuest && <button style={c.signInPrompt} onClick={() => router.push("/")}>sign in for history →</button>}
    <span style={c.metaText}>5 workers · 3 super AIs</span>
    </div>
    </div>

    {/* Main */}
    <div style={c.chatArea}>
    {/* Top bar */}
    <div style={c.topBar}>
    <button style={c.hamburger} onClick={() => setSidebarOpen(o => !o)}>☰</button>
    <span style={c.topBarPrompt}>[{username}@openvoxels]</span>
    <div style={c.topBarRight}>
    {loading && (
      <div style={c.loadRow}>
      {[0,1,2].map(i => <span key={i} style={{ ...c.loadDot, animationDelay: `${i*0.2}s` }} />)}
      <span style={c.loadText}>processing</span>
      </div>
    )}
    <div style={c.avatarBtn} onClick={() => setShowMenu(m => !m)}>
    {username[0].toUpperCase()}
    </div>
    {showMenu && (
      <div style={c.menu}>
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
      <div style={c.emptySubtext}>synthesis-based AI ensemble</div>
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
        <span style={c.aiLabel}>openvoxels:</span>
        <div style={c.aiText}>{msg.content}</div>
        {msg.tier && <div style={c.tierTag}>{tierLabel(msg.tier, msg.workerCount)}</div>}
        </div>
      )}
      </div>
    ))}
    {loading && (
      <div style={c.msgRow}>
      <div style={c.aiBlock}>
      <span style={c.aiLabel}>openvoxels:</span>
      <div style={c.thinkRow}>
      {[0,1,2].map(i => <span key={i} style={{ ...c.thinkDot, animationDelay: `${i*0.15}s` }} />)}
      <span style={c.thinkText}>routing · dispatching · synthesizing</span>
      </div>
      </div>
      </div>
    )}
    <div ref={bottomRef} />
    </div>

    {/* Input bar */}
    <div style={c.inputBar}>
    <button
    style={c.configBtn}
    onClick={() => setShowAiConfig(true)}
    title="AI configuration"
    >
    ⚙
    </button>
    <div style={c.inputPromptLabel}>[{username}@openvoxels]:</div>
    <textarea
    ref={inputRef}
    style={c.input}
    value={input}
    onChange={e => setInput(e.target.value)}
    onKeyDown={handleKey}
    placeholder="type your message..."
    rows={1}
    disabled={loading}
    />
    <button
    style={{ ...c.sendBtn, opacity: loading || !input.trim() ? 0.25 : 1 }}
    onClick={sendMessage}
    disabled={loading || !input.trim()}
    >↵</button>
    </div>
    </div>

    {/* AI Config Modal */}
    {showAiConfig && (
      <div style={c.overlay} onClick={() => setShowAiConfig(false)}>
      <div style={c.configModal} onClick={e => e.stopPropagation()}>
      <div style={c.modalHdr}>
      <span style={c.modalHdrTitle}>AI configuration</span>
      <div style={c.modalHdrRight}>
      <button style={c.resetBtn} onClick={resetAiConfig}>reset to default</button>
      <button style={c.modalCloseBtn} onClick={() => setShowAiConfig(false)}>✕</button>
      </div>
      </div>

      {/* Worker count */}
      <div style={c.configSection}>
      <div style={c.configSectionTitle}>worker count</div>
      <div style={c.workerCountRow}>
      {["auto", "1", "2", "3", "4", "5"].map(v => (
        <button
        key={v}
        style={{ ...c.countBtn, ...(workerCount === v ? c.countBtnActive : {}) }}
        onClick={() => setWorkerCount(v)}
        >
        {v}
        </button>
      ))}
      </div>
      <div style={c.configHint}>
      auto = tier 1→1 worker, tier 2→3 workers, tier 3→5 workers
      </div>
      </div>

      {/* Worker models */}
      <div style={c.configSection}>
      <div style={c.configSectionTitle}>worker models</div>
      <div style={c.configHint} style={{ marginBottom: "10px", color: "var(--text-muted)", fontSize: "11px" }}>
      select up to 5 · currently selected: {selectedWorkers.length}
      </div>
      <div style={c.modelGrid}>
      {AVAILABLE_WORKERS.map(w => (
        <button
        key={w.id}
        style={{
          ...c.modelChip,
          ...(selectedWorkers.includes(w.id) ? c.modelChipActive : {}),
        }}
        onClick={() => toggleWorker(w.id)}
        >
        <span style={c.modelChipProvider}>{w.provider}</span>
        <span style={c.modelChipLabel}>{w.label}</span>
        </button>
      ))}
      </div>
      </div>

      {/* Super AI models */}
      <div style={c.configSection}>
      <div style={c.configSectionTitle}>super AI models</div>
      <div style={c.configHint} style={{ marginBottom: "10px", color: "var(--text-muted)", fontSize: "11px" }}>
      core functions are locked — only the model changes
      </div>
      {[
        { key: "synthesizer", label: "super AI 1 — synthesis & formatting" },
        { key: "checker",     label: "super AI 2 — hallucination check" },
        { key: "safety",      label: "super AI 3 — safety layer" },
      ].map(({ key, label }) => (
        <div key={key} style={c.superAiRow}>
        <div style={c.superAiLabel}>{label}</div>
        <select
        style={c.superAiSelect}
        value={superModels[key]}
        onChange={e => setSuperModels(prev => ({ ...prev, [key]: e.target.value }))}
        >
        {AVAILABLE_SUPER_MODELS.map(m => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
        </select>
        </div>
      ))}
      </div>
      </div>
      </div>
    )}

    {/* Settings Modal */}
    {showSettings && (
      <div style={c.overlay} onClick={() => setShowSettings(false)}>
      <div style={c.settingsModal} onClick={e => e.stopPropagation()}>
      <div style={c.modalHdr}>
      <span style={c.modalHdrTitle}>settings</span>
      <button style={c.modalCloseBtn} onClick={() => setShowSettings(false)}>✕</button>
      </div>
      {[
        ["account",   isGuest ? "guest" : username],
        ["mode",      isGuest ? "guest session" : "authenticated"],
        ["workers",   `${selectedWorkers.length} selected`],
        ["super AIs", "synthesize · check · safety"],
        ["version",   "v1.0"],
      ].map(([label, val]) => (
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
  return <Suspense><ChatApp /></Suspense>;
}

const c = {
  layout: { display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)", position: "relative" },

  sidebarOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 5 },

  sidebar: {
    width: "240px", minWidth: "240px", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", background: "var(--surface)",
    position: "fixed", left: 0, top: 0, height: "100vh", zIndex: 10,
    transform: "translateX(-100%)", transition: "transform 0.25s ease",
  },
  sidebarVisible: { transform: "translateX(0)" },

  sidebarHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 16px", borderBottom: "1px solid var(--border)" },
  sidebarLogo: { fontSize: "13px", fontWeight: "700", color: "#d0d0d0" },
  newChatBtn: { background: "none", border: "1px solid var(--border2)", color: "var(--text-dim)", fontFamily: "var(--font)", fontSize: "16px", width: "26px", height: "26px", cursor: "pointer", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center" },

  sessionList: { flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "2px" },
  sessionItem: { display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "3px", cursor: "pointer", color: "var(--text-dim)", fontSize: "12px" },
  sessionActive: { background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" },
  sessionIcon: { color: "var(--green)", fontSize: "11px", flexShrink: 0 },
  sessionTitle: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 },

  sidebarFooter: { padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "6px" },
  signInPrompt: { background: "none", border: "none", color: "var(--green)", fontFamily: "var(--font)", fontSize: "11px", cursor: "pointer", textAlign: "left", padding: 0 },
  metaText: { fontSize: "10px", color: "var(--text-muted)" },

  chatArea: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },

  topBar: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)" },
  hamburger: { background: "none", border: "none", color: "var(--text-dim)", fontFamily: "var(--font)", fontSize: "16px", cursor: "pointer", flexShrink: 0, padding: "2px 4px" },
  topBarPrompt: { fontSize: "12px", color: "var(--green)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  topBarRight: { display: "flex", alignItems: "center", gap: "10px", position: "relative", flexShrink: 0 },

  loadRow: { display: "flex", alignItems: "center", gap: "4px" },
  loadDot: { width: "5px", height: "5px", borderRadius: "50%", background: "var(--green)", display: "block", animation: "pulse 1s ease-in-out infinite" },
  loadText: { fontSize: "10px", color: "var(--text-muted)", marginLeft: "4px" },

  avatarBtn: { width: "30px", height: "30px", borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "var(--text)", flexShrink: 0 },

  menu: { position: "absolute", top: "40px", right: 0, background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: "4px", width: "200px", zIndex: 100, overflow: "hidden", animation: "fadeUp 0.15s ease", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" },
  menuHeader: { padding: "12px 14px" },
  menuName: { fontSize: "13px", color: "var(--text)", fontWeight: "500" },
  menuEmail: { fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" },
  menuDivider: { height: "1px", background: "var(--border)" },
  menuItem: { display: "block", width: "100%", background: "none", border: "none", color: "var(--text-dim)", fontFamily: "var(--font)", fontSize: "12px", padding: "9px 14px", cursor: "pointer", textAlign: "left" },

  messages: { flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" },

  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "8px", marginTop: "80px", animation: "fadeIn 0.4s ease" },
  emptyLogo: { fontSize: "26px", fontWeight: "700", color: "#222" },
  emptySubtext: { fontSize: "11px", color: "var(--text-muted)" },
  emptyHints: { display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap", justifyContent: "center" },
  emptyHint: { fontSize: "10px", color: "var(--text-muted)", border: "1px solid var(--border)", padding: "3px 10px", borderRadius: "2px" },

  msgRow: { animation: "fadeUp 0.2s ease" },
  userLine: { fontSize: "13px", lineHeight: 1.6 },
  userPrompt: { color: "var(--green)", fontWeight: "500" },
  userText: { color: "#e0e0e0" },
  aiBlock: { display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "0" },
  aiLabel: { fontSize: "11px", color: "var(--text-muted)" },
  aiText: { fontSize: "13px", color: "var(--text)", lineHeight: 1.8, whiteSpace: "pre-wrap" },
  tierTag: { fontSize: "10px", color: "var(--green)", opacity: 0.6, letterSpacing: "0.05em" },
  thinkRow: { display: "flex", alignItems: "center", gap: "5px" },
  thinkDot: { width: "5px", height: "5px", borderRadius: "50%", background: "var(--text-muted)", display: "block", animation: "pulse 1s ease-in-out infinite" },
  thinkText: { fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", marginLeft: "4px" },

  inputBar: { display: "flex", alignItems: "flex-end", gap: "8px", padding: "14px 20px 20px", borderTop: "1px solid var(--border)", background: "var(--surface)" },
  configBtn: { background: "none", border: "1px solid var(--border2)", color: "var(--text-dim)", fontFamily: "var(--font)", fontSize: "16px", width: "42px", height: "42px", cursor: "pointer", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  inputPromptLabel: { fontSize: "12px", color: "var(--green)", paddingBottom: "10px", flexShrink: 0, whiteSpace: "nowrap" },
  input: { flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "3px", color: "var(--text)", fontFamily: "var(--font)", fontSize: "13px", padding: "10px 14px", resize: "none", outline: "none", lineHeight: 1.5, minHeight: "42px", maxHeight: "160px" },
  sendBtn: { background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text)", fontFamily: "var(--font)", fontSize: "16px", width: "42px", height: "42px", cursor: "pointer", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)", padding: "16px" },

  configModal: { background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: "6px", padding: "24px", width: "100%", maxWidth: "560px", maxHeight: "85vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px", animation: "fadeUp 0.2s ease", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" },
  settingsModal: { background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: "6px", padding: "24px", width: "100%", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "4px", animation: "fadeUp 0.2s ease" },

  modalHdr: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalHdrTitle: { fontSize: "14px", fontWeight: "600", color: "#d0d0d0" },
  modalHdrRight: { display: "flex", alignItems: "center", gap: "10px" },
  resetBtn: { background: "none", border: "1px solid var(--border2)", color: "var(--text-dim)", fontFamily: "var(--font)", fontSize: "11px", padding: "4px 10px", cursor: "pointer", borderRadius: "2px" },
  modalCloseBtn: { background: "none", border: "none", color: "var(--text-dim)", fontFamily: "var(--font)", fontSize: "14px", cursor: "pointer" },

  configSection: { display: "flex", flexDirection: "column", gap: "10px" },
  configSectionTitle: { fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", paddingBottom: "8px" },
  configHint: { fontSize: "10px", color: "var(--text-muted)" },

  workerCountRow: { display: "flex", gap: "6px", flexWrap: "wrap" },
  countBtn: { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-dim)", fontFamily: "var(--font)", fontSize: "12px", padding: "6px 14px", cursor: "pointer", borderRadius: "2px" },
  countBtnActive: { background: "var(--green-dim)", border: "1px solid var(--green)", color: "var(--green)" },

  modelGrid: { display: "flex", flexWrap: "wrap", gap: "6px" },
  modelChip: { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-dim)", fontFamily: "var(--font)", fontSize: "11px", padding: "6px 10px", cursor: "pointer", borderRadius: "2px", display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" },
  modelChipActive: { background: "var(--green-dim)", border: "1px solid var(--green)", color: "var(--green)" },
  modelChipProvider: { fontSize: "9px", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" },
  modelChipLabel: { fontSize: "11px" },

  superAiRow: { display: "flex", flexDirection: "column", gap: "6px", padding: "10px", background: "var(--surface2)", borderRadius: "3px", border: "1px solid var(--border)" },
  superAiLabel: { fontSize: "11px", color: "var(--text-dim)" },
  superAiSelect: { background: "var(--bg)", border: "1px solid var(--border2)", color: "var(--text)", fontFamily: "var(--font)", fontSize: "12px", padding: "6px 10px", borderRadius: "2px", outline: "none", cursor: "pointer", width: "100%" },

  settingRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" },
  settingLabel: { fontSize: "12px", color: "var(--text-dim)" },
  settingVal: { fontSize: "12px", color: "var(--text)" },
};
