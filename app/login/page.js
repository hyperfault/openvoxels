"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function handleGoogle() {
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/chat` },
    });
    if (error) setError(error.message);
  }

  async function handleAuth() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    if (!supabase) { setError("Auth unavailable"); setLoading(false); return; }

    try {
      if (mode === "login") {
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
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div style={s.page}>
      <div style={s.noise} />

      {/* Back button */}
      <button style={s.backBtn} onClick={() => router.push("/")}>
        ← openvoxels.
      </button>

      <div style={s.container}>
        {/* Left — branding */}
        <div style={s.left}>
          <div style={s.leftInner}>
            <div style={s.eyebrow}>synthesis-based AI ensemble</div>
            <div style={s.bigLogo}>openvoxels.</div>
            <div style={s.tagline}>five minds.<br /><span style={s.taglineDim}>one answer.</span></div>
            <div style={s.pills}>
              {["5 workers", "3 super AIs", "auto-routing", "hallucination check"].map(p => (
                <span key={p} style={s.pill}>{p}</span>
              ))}
            </div>
            <div style={s.terminalPreview}>
              <div style={s.termLine}><span style={s.termPrompt}>[user@openvoxels]:</span> explain quantum entanglement</div>
              <div style={s.termThink}>// tier 3 · dispatching 5 workers...</div>
              <div style={s.termOut}><span style={s.termLabel}>openvoxels:</span> Quantum entanglement is a phenomenon where two particles become correlated...</div>
            </div>
          </div>
        </div>

        {/* Right — auth form */}
        <div style={s.right}>
          <div style={s.card}>
            <div style={s.cardHeader}>
              <div style={s.cardTitle}>
                {mode === "login" ? "welcome back." : "join openvoxels."}
              </div>
              <div style={s.cardSub}>
                {mode === "login" ? "sign in to continue" : "create your account"}
              </div>
            </div>

            {/* Mode tabs */}
            <div style={s.tabs}>
              <button
                style={{ ...s.tab, ...(mode === "login" ? s.tabActive : {}) }}
                onClick={() => { setMode("login"); setError(""); }}
              >
                sign in
              </button>
              <button
                style={{ ...s.tab, ...(mode === "signup" ? s.tabActive : {}) }}
                onClick={() => { setMode("signup"); setError(""); }}
              >
                sign up
              </button>
            </div>

            {/* Google */}
            <button style={s.googleBtn} onClick={handleGoogle}>
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: "8px", flexShrink: 0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              continue with google
            </button>

            <div style={s.divider}>
              <span style={s.divLine} />
              <span style={s.divText}>or</span>
              <span style={s.divLine} />
            </div>

            {/* Fields */}
            {mode === "signup" && (
              <div style={s.field}>
                <label style={s.label}>username</label>
                <input
                  style={s.input}
                  placeholder="your_name"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            )}
            <div style={s.field}>
              <label style={s.label}>email</label>
              <input
                style={s.input}
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>password</label>
              <input
                style={s.input}
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAuth()}
              />
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <button style={s.submitBtn} onClick={handleAuth} disabled={loading}>
              {loading ? "..." : mode === "login" ? "sign in →" : "create account →"}
            </button>

            <button style={s.guestBtn} onClick={() => router.push("/chat?guest=true")}>
              continue as guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "var(--bg)",
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
  backBtn: {
    position: "absolute",
    top: "20px",
    left: "24px",
    background: "none",
    border: "none",
    color: "var(--text-dim)",
    fontFamily: "var(--font)",
    fontSize: "12px",
    cursor: "pointer",
    zIndex: 10,
    padding: "6px 0",
  },
  container: {
    flex: 1,
    display: "flex",
    minHeight: "100vh",
  },
  left: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 60px",
    borderRight: "1px solid var(--border)",
    position: "relative",
    zIndex: 1,
  },
  leftInner: {
    maxWidth: "440px",
    animation: "fadeUp 0.6s ease both",
  },
  eyebrow: {
    fontSize: "10px",
    color: "var(--green)",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    marginBottom: "20px",
  },
  bigLogo: {
    fontSize: "56px",
    fontWeight: "700",
    color: "#e8e8e8",
    letterSpacing: "-2px",
    lineHeight: 1,
    marginBottom: "16px",
  },
  tagline: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#e8e8e8",
    lineHeight: 1.2,
    marginBottom: "24px",
    letterSpacing: "-0.5px",
  },
  taglineDim: {
    color: "var(--text-dim)",
    fontWeight: "300",
    fontStyle: "italic",
  },
  pills: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "32px",
  },
  pill: {
    fontSize: "10px",
    color: "var(--green)",
    border: "1px solid var(--green-dim)",
    background: "var(--green-dim)",
    padding: "3px 10px",
    borderRadius: "2px",
    letterSpacing: "0.05em",
  },
  terminalPreview: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  termLine: {
    fontSize: "11px",
    color: "#e0e0e0",
    lineHeight: 1.5,
  },
  termPrompt: {
    color: "var(--green)",
  },
  termThink: {
    fontSize: "11px",
    color: "var(--text-muted)",
    fontStyle: "italic",
  },
  termOut: {
    fontSize: "11px",
    color: "var(--text)",
    lineHeight: 1.6,
  },
  termLabel: {
    color: "#888",
  },
  right: {
    width: "480px",
    minWidth: "480px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 60px",
    position: "relative",
    zIndex: 1,
  },
  card: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    animation: "fadeUp 0.6s ease 0.1s both",
  },
  cardHeader: {
    marginBottom: "8px",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#e0e0e0",
    letterSpacing: "-0.5px",
    marginBottom: "4px",
  },
  cardSub: {
    fontSize: "12px",
    color: "var(--text-dim)",
  },
  tabs: {
    display: "flex",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    overflow: "hidden",
    padding: "3px",
    gap: "3px",
  },
  tab: {
    flex: 1,
    background: "none",
    border: "none",
    color: "var(--text-dim)",
    fontFamily: "var(--font)",
    fontSize: "12px",
    padding: "8px",
    cursor: "pointer",
    borderRadius: "2px",
    transition: "all 0.15s ease",
  },
  tabActive: {
    background: "var(--surface2)",
    color: "var(--text)",
    borderBottom: "1px solid var(--green)",
  },
  googleBtn: {
    background: "var(--surface)",
    border: "1px solid var(--border2)",
    color: "var(--text)",
    fontFamily: "var(--font)",
    fontSize: "12px",
    padding: "12px",
    cursor: "pointer",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    transition: "border-color 0.15s ease",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  divLine: {
    flex: 1,
    height: "1px",
    background: "var(--border)",
    display: "block",
  },
  divText: {
    fontSize: "10px",
    color: "var(--text-muted)",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "10px",
    color: "var(--text-dim)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  input: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    color: "var(--text)",
    fontFamily: "var(--font)",
    fontSize: "13px",
    padding: "11px 14px",
    outline: "none",
    width: "100%",
    transition: "border-color 0.15s ease",
  },
  errorBox: {
    fontSize: "11px",
    color: "#e74c3c",
    padding: "10px 12px",
    background: "rgba(231,76,60,0.08)",
    borderRadius: "4px",
    border: "1px solid rgba(231,76,60,0.2)",
  },
  submitBtn: {
    background: "#e8e8e8",
    color: "#080808",
    border: "none",
    fontFamily: "var(--font)",
    fontSize: "13px",
    fontWeight: "700",
    padding: "12px",
    cursor: "pointer",
    borderRadius: "4px",
    width: "100%",
    letterSpacing: "0.02em",
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
