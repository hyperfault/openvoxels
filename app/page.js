"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const DEMO_LINES = [
  { type: "input", user: "guest", text: "what is the nature of consciousness?" },
  { type: "thinking", text: "routing → tier 3 · dispatching 5 workers..." },
  { type: "output", text: "Consciousness remains one of philosophy's hardest problems. The synthesis across your workers converges on three main camps..." },
  { type: "input", user: "guest", text: "which view has the most scientific support?" },
  { type: "thinking", text: "routing → tier 2 · dispatching 3 workers..." },
  { type: "output", text: "Physicalism, particularly integrated information theory (IIT), currently dominates neuroscience..." },
];

export default function LandingPage() {
  const router = useRouter();
  const [demoIndex, setDemoIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState([]);
  const [typing, setTyping] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState("typing");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const terminalRef = useRef(null);
  const supabase = createClient();

  useEffect(() => {
    if (demoIndex >= DEMO_LINES.length) {
      setTimeout(() => {
        setDisplayedLines([]);
        setDemoIndex(0);
        setTyping("");
        setCharIndex(0);
        setPhase("typing");
      }, 3000);
      return;
    }

    const line = DEMO_LINES[demoIndex];

    if (line.type === "thinking") {
      setTimeout(() => {
        setDisplayedLines(prev => [...prev, line]);
        setDemoIndex(i => i + 1);
      }, 800);
      return;
    }

    if (phase === "typing") {
      if (charIndex < line.text.length) {
        const delay = line.type === "input" ? 45 : 8;
        const timer = setTimeout(() => {
          setTyping(line.text.slice(0, charIndex + 1));
          setCharIndex(i => i + 1);
        }, delay);
        return () => clearTimeout(timer);
      } else {
        setPhase("waiting");
        setTimeout(() => setPhase("next"), line.type === "input" ? 600 : 1200);
      }
    }

    if (phase === "next") {
      setDisplayedLines(prev => [...prev, { ...line, text: typing }]);
      setTyping("");
      setCharIndex(0);
      setPhase("typing");
      setDemoIndex(i => i + 1);
    }
  }, [demoIndex, charIndex, phase, typing]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayedLines, typing]);

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/chat` },
    });
    if (error) setAuthError(error.message);
  }

  async function handleAuth() {
    setAuthLoading(true);
    setAuthError("");
    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/chat");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (error) throw error;
        router.push("/chat");
      }
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleGuest() {
    router.push("/chat?guest=true");
  }

  return (
    <div style={s.page}>
      <div style={s.noise} />
      <header style={s.header}>
        <div style={s.logo}>openvoxels.</div>
        <div style={s.headerRight}>
          <span style={s.badge}>v1.0</span>
          <button style={s.headerBtn} onClick={() => { setShowAuth(true); setAuthMode("login"); }}>
            sign in
          </button>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.heroLeft}>
          <div style={s.eyebrow}>synthesis-based AI ensemble</div>
          <h1 style={s.title}>
            <span style={s.titleMain}>five minds.</span>
            <span style={s.titleSub}>one answer.</span>
          </h1>
          <p style={s.desc}>
            5 AI workers answer in parallel. 3 super AIs synthesize, fact-check, and safety-review. openvoxels. routes automatically.
          </p>

          <div style={s.pipeline}>
            <div style={s.pipelineRow}>
              {["mistral", "llama", "deepseek", "qwen", "gpt-oss"].map((m, i) => (
                <div key={m} style={{ ...s.pipeChip, animationDelay: `${i * 0.1}s` }}>
                  {m}
                </div>
              ))}
            </div>
            <div style={s.pipeArrow}>↓</div>
            <div style={s.pipelineRow}>
              {["synthesize", "fact-check", "safety"].map((m, i) => (
                <div key={m} style={{ ...s.pipeChip, ...s.pipeChipSuper, animationDelay: `${(i + 5) * 0.1}s` }}>
                  {m}
                </div>
              ))}
            </div>
            <div style={s.pipeArrow}>↓</div>
            <div style={s.pipeResult}>final answer</div>
          </div>

          <div style={s.ctas}>
            <button style={s.ctaPrimary} onClick={() => { setShowAuth(true); setAuthMode("signup"); }}>
              create account
            </button>
            <button style={s.ctaSecondary} onClick={() => { setShowAuth(true); setAuthMode("login"); }}>
              sign in
            </button>
            <button style={s.ctaGhost} onClick={handleGuest}>
              guest →
            </button>
          </div>
        </div>

        <div style={s.heroRight}>
          <div style={s.terminalWindow}>
            <div style={s.terminalBar}>
              <div style={s.terminalDots}>
                {[0, 1, 2].map(i => <span key={i} style={{ ...s.dot, background: "#3a3a3a" }} />)}
              </div>
              <span style={s.terminalTitle}>openvoxels. — demo</span>
            </div>
            <div style={s.terminalBody} ref={terminalRef}>
              {displayedLines.map((line, i) => (
                <div key={i} style={s.terminalLine}>
                  {line.type === "input" && (
                    <span>
                      <span style={s.prompt}>[{line.user}@openvoxels]:</span>
                      <span style={s.promptText}> {line.text}</span>
                    </span>
                  )}
                  {line.type === "thinking" && (
                    <span style={s.thinking}>// {line.text}</span>
                  )}
                  {line.type === "output" && (
                    <span>
                      <span style={s.outputLabel}>openvoxels:</span>
                      <span style={s.outputText}> {line.text}</span>
                    </span>
                  )}
                </div>
              ))}
              {typing && (
                <div style={s.terminalLine}>
                  {DEMO_LINES[demoIndex]?.type === "input" && (
                    <span>
                      <span style={s.prompt}>[guest@openvoxels]:</span>
                      <span style={s.promptText}> {typing}</span>
                      <span style={s.cursor}>█</span>
                    </span>
                  )}
                  {DEMO_LINES[demoIndex]?.type === "output" && (
                    <span>
                      <span style={s.outputLabel}>openvoxels:</span>
                      <span style={s.outputText}> {typing}</span>
                      <span style={s.cursor}>█</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div style={s.statsBar}>
        {[["5", "workers"], ["3", "super AIs"], ["3", "tiers"], ["∞", "retries"]].map(([val, label]) => (
          <div key={label} style={s.stat}>
            <span style={s.statVal}>{val}</span>
            <span style={s.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {showAuth && (
        <div style={s.overlay} onClick={() => setShowAuth(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>openvoxels.</span>
              <button style={s.modalClose} onClick={() => setShowAuth(false)}>✕</button>
            </div>

            <div style={s.modalTabs}>
              <button
                style={{ ...s.modalTab, ...(authMode === "login" ? s.modalTabActive : {}) }}
                onClick={() => setAuthMode("login")}
              >login</button>
              <button
                style={{ ...s.modalTab, ...(authMode === "signup" ? s.modalTabActive : {}) }}
                onClick={() => setAuthMode("signup")}
              >sign up</button>
            </div>

            <button style={s.googleBtn} onClick={handleGoogle}>
              google
            </button>

            <div style={s.divider}>
              <span style={s.dividerLine} />
              <span style={s.dividerText}>or</span>
              <span style={s.dividerLine} />
            </div>

            {authMode === "signup" && (
              <input style={s.input} placeholder="username" value={username} onChange={e => setUsername(e.target.value)} />
            )}
            <input style={s.input} placeholder="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input style={s.input} placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAuth()} />

            {authError && <div style={s.authError}>{authError}</div>}

            <button style={s.authSubmit} onClick={handleAuth} disabled={authLoading}>
              {authLoading ? "..." : authMode === "login" ? "sign in" : "create account"}
            </button>

            <button style={s.guestBtn} onClick={handleGuest}>
              guest →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  },
  noise: {
    position: "fixed",
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
    pointerEvents: "none",
    zIndex: 0,
    opacity: 0.4,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid var(--border)",
    position: "relative",
    zIndex: 10,
  },
  logo: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#e0e0e0",
    letterSpacing: "-0.3px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  badge: {
    fontSize: "10px",
    color: "var(--text-dim)",
    border: "1px solid var(--border2)",
    padding: "2px 8px",
    borderRadius: "2px",
  },
  headerBtn: {
    background: "none",
    border: "1px solid var(--border2)",
    color: "var(--text-dim)",
    fontFamily: "var(--font)",
    fontSize: "12px",
    padding: "6px 14px",
    cursor: "pointer",
    borderRadius: "2px",
  },
  main: {
    flex: 1,
    display: "flex",
    gap: "40px",
    padding: "40px 24px",
    alignItems: "center",
    position: "relative",
    zIndex: 10,
    justifyContent: "center",
    flexWrap: "wrap",
    "@media (max-width: 1024px)": {
      gap: "30px",
      padding: "30px 20px",
    },
    "@media (max-width: 768px)": {
      flexDirection: "column",
      gap: "24px",
      padding: "24px 16px",
    },
  },
  heroLeft: {
    flex: "0 0 420px",
    animation: "fadeUp 0.6s ease both",
    "@media (max-width: 768px)": {
      flex: "1",
      width: "100%",
    },
  },
  eyebrow: {
    fontSize: "10px",
    color: "var(--green)",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    marginBottom: "16px",
  },
  title: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "16px",
  },
  titleMain: {
    fontSize: "48px",
    fontWeight: "700",
    color: "#e8e8e8",
    lineHeight: 1.1,
    letterSpacing: "-1px",
    "@media (max-width: 768px)": {
      fontSize: "32px",
    },
  },
  titleSub: {
    fontSize: "48px",
    fontWeight: "300",
    color: "var(--text-dim)",
    lineHeight: 1.1,
    letterSpacing: "-1px",
    fontStyle: "italic",
    "@media (max-width: 768px)": {
      fontSize: "32px",
    },
  },
  desc: {
    fontSize: "13px",
    color: "var(--text-dim)",
    lineHeight: 1.8,
    marginBottom: "24px",
    maxWidth: "380px",
  },
  pipeline: {
    marginBottom: "28px",
    padding: "12px",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    background: "var(--surface)",
    fontSize: "11px",
  },
  pipelineRow: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
  },
  pipeChip: {
    fontSize: "10px",
    color: "var(--text-dim)",
    border: "1px solid var(--border2)",
    padding: "3px 8px",
    borderRadius: "2px",
    background: "var(--surface2)",
    animation: "fadeIn 0.4s ease both",
  },
  pipeChipSuper: {
    color: "var(--green)",
    borderColor: "var(--green-dim)",
    background: "var(--green-dim)",
  },
  pipeArrow: {
    fontSize: "10px",
    color: "var(--text-muted)",
    margin: "6px 0",
  },
  pipeResult: {
    fontSize: "11px",
    color: "#888",
  },
  ctas: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
    "@media (max-width: 768px)": {
      flexDirection: "column",
      width: "100%",
    },
  },
  ctaPrimary: {
    background: "#e8e8e8",
    color: "#080808",
    border: "none",
    fontFamily: "var(--font)",
    fontSize: "12px",
    fontWeight: "600",
    padding: "10px 20px",
    cursor: "pointer",
    borderRadius: "2px",
    "@media (max-width: 768px)": {
      width: "100%",
    },
  },
  ctaSecondary: {
    background: "none",
    color: "var(--text)",
    border: "1px solid var(--border2)",
    fontFamily: "var(--font)",
    fontSize: "12px",
    padding: "10px 20px",
    cursor: "pointer",
    borderRadius: "2px",
    "@media (max-width: 768px)": {
      width: "100%",
    },
  },
  ctaGhost: {
    background: "none",
    border: "none",
    color: "var(--text-dim)",
    fontFamily: "var(--font)",
    fontSize: "12px",
    cursor: "pointer",
    padding: "10px 0",
  },
  heroRight: {
    flex: "1",
    minWidth: "360px",
    animation: "fadeUp 0.6s ease 0.2s both",
    "@media (max-width: 1024px)": {
      minWidth: "300px",
    },
    "@media (max-width: 768px)": {
      width: "100%",
      minWidth: "auto",
    },
  },
  terminalWindow: {
    border: "1px solid var(--border)",
    borderRadius: "6px",
    overflow: "hidden",
    background: "var(--surface)",
    boxShadow: "0 0 60px rgba(0,0,0,0.5)",
  },
  terminalBar: {
    background: "var(--surface2)",
    borderBottom: "1px solid var(--border)",
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  terminalDots: {
    display: "flex",
    gap: "6px",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    display: "block",
  },
  terminalTitle: {
    fontSize: "11px",
    color: "var(--text-muted)",
    flex: 1,
    textAlign: "center",
  },
  terminalBody: {
    padding: "16px",
    minHeight: "260px",
    maxHeight: "360px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  terminalLine: {
    fontSize: "11px",
    lineHeight: 1.6,
    animation: "fadeIn 0.2s ease",
  },
  prompt: { color: "var(--green)" },
  promptText: { color: "#e0e0e0" },
  thinking: { color: "var(--text-muted)", fontStyle: "italic" },
  outputLabel: { color: "#888" },
  outputText: { color: "var(--text)" },
  cursor: {
    color: "var(--green)",
    animation: "blink 1s step-end infinite",
  },
  statsBar: {
    display: "flex",
    borderTop: "1px solid var(--border)",
    position: "relative",
    zIndex: 10,
    "@media (max-width: 768px)": {
      flexDirection: "column",
    },
  },
  stat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px",
    borderRight: "1px solid var(--border)",
    gap: "4px",
    "@media (max-width: 768px)": {
      borderRight: "none",
      borderBottom: "1px solid var(--border)",
      padding: "12px",
    },
  },
  statVal: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#d0d0d0",
  },
  statLabel: {
    fontSize: "10px",
    color: "var(--text-muted)",
    letterSpacing: "0.05em",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.15s ease",
    backdropFilter: "blur(4px)",
    padding: "16px",
  },
  modal: {
    background: "var(--surface)",
    border: "1px solid var(--border2)",
    borderRadius: "6px",
    padding: "24px",
    width: "100%",
    maxWidth: "360px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    animation: "fadeUp 0.2s ease",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },
  modalTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#e0e0e0",
  },
  modalClose: {
    background: "none",
    border: "none",
    color: "var(--text-dim)",
    fontFamily: "var(--font)",
    fontSize: "14px",
    cursor: "pointer",
  },
  modalTabs: {
    display: "flex",
    border: "1px solid var(--border)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  modalTab: {
    flex: 1,
    background: "none",
    border: "none",
    color: "var(--text-dim)",
    fontFamily: "var(--font)",
    fontSize: "12px",
    padding: "8px",
    cursor: "pointer",
  },
  modalTabActive: {
    background: "var(--surface2)",
    color: "var(--text)",
  },
  googleBtn: {
    background: "var(--surface2)",
    border: "1px solid var(--border2)",
    color: "var(--text)",
    fontFamily: "var(--font)",
    fontSize: "12px",
    padding: "10px",
    cursor: "pointer",
    borderRadius: "3px",
    width: "100%",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "4px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "var(--border)",
  },
  dividerText: {
    fontSize: "10px",
    color: "var(--text-muted)",
  },
  input: {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "3px",
    color: "var(--text)",
    fontFamily: "var(--font)",
    fontSize: "12px",
    padding: "10px 12px",
    outline: "none",
    width: "100%",
  },
  authError: {
    fontSize: "11px",
    color: "#c0392b",
    padding: "8px 10px",
    background: "rgba(192,57,43,0.1)",
    borderRadius: "3px",
    border: "1px solid rgba(192,57,43,0.2)",
  },
  authSubmit: {
    background: "#e8e8e8",
    color: "#080808",
    border: "none",
    fontFamily: "var(--font)",
    fontSize: "12px",
    fontWeight: "600",
    padding: "10px",
    cursor: "pointer",
    borderRadius: "3px",
    width: "100%",
  },
  guestBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    fontFamily: "var(--font)",
    fontSize: "11px",
    cursor: "pointer",
    textAlign: "center",
    width: "100%",
    padding: "4px",
  },
};
