"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_LINES = [
  { type: "input", user: "guest", text: "what is the nature of consciousness?" },
  { type: "thinking", text: "routing → tier 3 · dispatching 5 workers..." },
  { type: "output", text: "Consciousness remains one of philosophy's hardest problems. The synthesis across your workers converges on three main camps: physicalism, dualism, and panpsychism..." },
  { type: "input", user: "guest", text: "which view has the most scientific support?" },
  { type: "thinking", text: "routing → tier 2 · dispatching 3 workers..." },
  { type: "output", text: "Physicalism, particularly integrated information theory (IIT) and global workspace theory (GWT), currently dominates neuroscience..." },
];

export default function LandingPage() {
  const router = useRouter();
  const [demoIndex, setDemoIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState([]);
  const [typing, setTyping] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState("typing");
  const terminalRef = useRef(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

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

  return (
    <div style={s.page}>
      <div style={s.noise} />

      <header style={s.header}>
        <div style={s.logo}>openvoxels.</div>
        <div style={s.headerRight}>
          <span style={s.badge}>v1.0</span>
          <button style={s.headerBtn} onClick={() => router.push("/login")}>sign in</button>
          <button style={s.headerBtnPrimary} onClick={() => router.push("/login")}>get started</button>
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
            5 AI workers answer in parallel. 3 super AIs synthesize, fact-check, and safety-review the result. openvoxels. routes your query to the right number of workers automatically.
          </p>

          <div style={s.pipeline}>
            <div style={s.pipeRow}>
              <div style={s.pipeLabel}>workers</div>
              <div style={s.pipeChips}>
                {["llama", "gpt-oss", "deepseek", "qwen", "gemma"].map((m, i) => (
                  <div key={m} style={{ ...s.pipeChip, animationDelay: `${i * 0.08}s` }}>{m}</div>
                ))}
              </div>
            </div>
            <div style={s.pipeConnector}>
              <span style={s.pipeArrowLine} />
              <span style={s.pipeArrowDown}>↓</span>
            </div>
            <div style={s.pipeRow}>
              <div style={s.pipeLabel}>super AIs</div>
              <div style={s.pipeChips}>
                {["synthesize", "fact-check", "safety"].map((m, i) => (
                  <div key={m} style={{ ...s.pipeChip, ...s.pipeChipSuper, animationDelay: `${(i + 5) * 0.08}s` }}>{m}</div>
                ))}
              </div>
            </div>
            <div style={s.pipeConnector}>
              <span style={s.pipeArrowLine} />
              <span style={s.pipeArrowDown}>↓</span>
            </div>
            <div style={s.pipeFinal}>final answer</div>
          </div>

          <div style={s.ctas}>
            <button style={s.ctaPrimary} onClick={() => router.push("/login")}>
              create account
            </button>
            <button style={s.ctaSecondary} onClick={() => router.push("/chat?guest=true")}>
              try as guest →
            </button>
          </div>
        </div>

        <div style={s.heroRight}>
          <div style={s.terminalWindow}>
            <div style={s.terminalBar}>
              <div style={s.terminalDots}>
                {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
                  <span key={i} style={{ ...s.dot, background: c, opacity: 0.4 }} />
                ))}
              </div>
              <span style={s.terminalTitle}>openvoxels. — live demo</span>
              <div style={s.terminalLive}>
                <span style={s.liveDot} />
                live
              </div>
            </div>
            <div style={s.terminalBody} ref={terminalRef}>
              {displayedLines.map((line, i) => (
                <div key={i} style={s.terminalLine}>
                  {line.type === "input" && (
                    <div style={s.inputLine}>
                      <span style={s.prompt}>[{line.user}@openvoxels]:</span>
                      <span style={s.promptText}> {line.text}</span>
                    </div>
                  )}
                  {line.type === "thinking" && (
                    <div style={s.thinkingLine}>// {line.text}</div>
                  )}
                  {line.type === "output" && (
                    <div style={s.outputLine}>
                      <span style={s.outputLabel}>openvoxels: </span>
                      <span style={s.outputText}>{line.text}</span>
                    </div>
                  )}
                </div>
              ))}
              {typing && (
                <div style={s.terminalLine}>
                  {DEMO_LINES[demoIndex]?.type === "input" && (
                    <div style={s.inputLine}>
                      <span style={s.prompt}>[guest@openvoxels]:</span>
                      <span style={s.promptText}> {typing}</span>
                      <span style={s.cursor}>█</span>
                    </div>
                  )}
                  {DEMO_LINES[demoIndex]?.type === "output" && (
                    <div style={s.outputLine}>
                      <span style={s.outputLabel}>openvoxels: </span>
                      <span style={s.outputText}>{typing}</span>
                      <span style={s.cursor}>█</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div style={s.statsBar}>
        {[
          ["5", "worker models"],
          ["3", "super AIs"],
          ["3", "quality tiers"],
          ["∞", "hallucination retries"],
        ].map(([val, label]) => (
          <div key={label} style={s.stat}>
            <span style={s.statVal}>{val}</span>
            <span style={s.statLabel}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", background: "var(--bg)" },
  noise: { position: "fixed", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`, pointerEvents: "none", zIndex: 0, opacity: 0.4 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", borderBottom: "1px solid var(--border)", position: "relative", zIndex: 10 },
  logo: { fontSize: "15px", fontWeight: "700", color: "#e0e0e0", letterSpacing: "-0.3px" },
  headerRight: { display: "flex", alignItems: "center", gap: "10px" },
  badge: { fontSize: "10px", color: "var(--text-muted)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: "2px" },
  headerBtn: { background: "none", border: "1px solid var(--border2)", color: "var(--text-dim)", fontFamily: "var(--font)", fontSize: "12px", padding: "7px 16px", cursor: "pointer", borderRadius: "3px" },
  headerBtnPrimary: { background: "#e8e8e8", border: "none", color: "#080808", fontFamily: "var(--font)", fontSize: "12px", fontWeight: "600", padding: "7px 16px", cursor: "pointer", borderRadius: "3px" },
  main: { flex: 1, display: "flex", gap: "60px", padding: "60px 32px", alignItems: "center", position: "relative", zIndex: 10, justifyContent: "center", flexWrap: "wrap" },
  heroLeft: { flex: "0 0 420px", animation: "fadeUp 0.6s ease both" },
  eyebrow: { fontSize: "10px", color: "var(--green)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "18px" },
  title: { display: "flex", flexDirection: "column", marginBottom: "18px" },
  titleMain: { fontSize: "52px", fontWeight: "700", color: "#e8e8e8", lineHeight: 1.05, letterSpacing: "-1.5px" },
  titleSub: { fontSize: "52px", fontWeight: "300", color: "var(--text-dim)", lineHeight: 1.05, letterSpacing: "-1.5px", fontStyle: "italic" },
  desc: { fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.9, marginBottom: "28px", maxWidth: "380px" },
  pipeline: { marginBottom: "32px", padding: "16px", border: "1px solid var(--border)", borderRadius: "6px", background: "var(--surface)", display: "flex", flexDirection: "column", gap: "8px" },
  pipeRow: { display: "flex", alignItems: "center", gap: "12px" },
  pipeLabel: { fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", width: "54px", flexShrink: 0 },
  pipeChips: { display: "flex", gap: "4px", flexWrap: "wrap" },
  pipeChip: { fontSize: "10px", color: "var(--text-dim)", border: "1px solid var(--border2)", padding: "3px 8px", borderRadius: "2px", background: "var(--surface2)", animation: "fadeIn 0.4s ease both" },
  pipeChipSuper: { color: "var(--green)", borderColor: "var(--green-dim)", background: "var(--green-dim)" },
  pipeConnector: { display: "flex", alignItems: "center", paddingLeft: "66px", gap: "4px" },
  pipeArrowLine: { display: "block", width: "1px", height: "8px", background: "var(--border2)" },
  pipeArrowDown: { fontSize: "10px", color: "var(--text-muted)" },
  pipeFinal: { fontSize: "11px", color: "#888", paddingLeft: "66px" },
  ctas: { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" },
  ctaPrimary: { background: "#e8e8e8", color: "#080808", border: "none", fontFamily: "var(--font)", fontSize: "12px", fontWeight: "700", padding: "11px 22px", cursor: "pointer", borderRadius: "3px" },
  ctaSecondary: { background: "none", border: "none", color: "var(--text-dim)", fontFamily: "var(--font)", fontSize: "12px", cursor: "pointer", padding: "11px 0" },
  heroRight: { flex: 1, minWidth: "340px", animation: "fadeUp 0.6s ease 0.15s both" },
  terminalWindow: { border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", background: "var(--surface)", boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 24px 80px rgba(0,0,0,0.6)" },
  terminalBar: { background: "var(--surface2)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px" },
  terminalDots: { display: "flex", gap: "6px" },
  dot: { width: "10px", height: "10px", borderRadius: "50%", display: "block" },
  terminalTitle: { fontSize: "11px", color: "var(--text-muted)", flex: 1, textAlign: "center" },
  terminalLive: { display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", color: "var(--green)", opacity: 0.7 },
  liveDot: { width: "5px", height: "5px", borderRadius: "50%", background: "var(--green)", display: "block", animation: "pulse 2s ease-in-out infinite" },
  terminalBody: { padding: "20px", minHeight: "280px", maxHeight: "380px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" },
  terminalLine: { animation: "fadeIn 0.2s ease" },
  inputLine: { fontSize: "12px", lineHeight: 1.5 },
  prompt: { color: "var(--green)" },
  promptText: { color: "#e0e0e0" },
  thinkingLine: { fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.5 },
  outputLine: { fontSize: "12px", lineHeight: 1.7 },
  outputLabel: { color: "#666" },
  outputText: { color: "var(--text)" },
  cursor: { color: "var(--green)", animation: "blink 1s step-end infinite" },
  statsBar: { display: "flex", borderTop: "1px solid var(--border)", position: "relative", zIndex: 10 },
  stat: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "18px", borderRight: "1px solid var(--border)", gap: "4px" },
  statVal: { fontSize: "20px", fontWeight: "700", color: "#d0d0d0" },
  statLabel: { fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.05em", textAlign: "center" },
};
