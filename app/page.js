"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_LINES = [
  { type: "input", user: "guest", text: "what is the nature of consciousness?" },
  { type: "thinking", text: "routing → tier 3 · dispatching 5 workers..." },
  { type: "output", text: "Consciousness remains one of philosophy's hardest problems..." },
  { type: "input", user: "guest", text: "which view has the most scientific support?" },
  { type: "thinking", text: "routing → tier 2 · dispatching 3 workers..." },
  { type: "output", text: "Physicalism, particularly integrated information theory (IIT), currently dominates..." },
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
        <button style={s.headerBtn} onClick={() => router.push("/chat")}>
          start
        </button>
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

          <button style={s.ctaPrimary} onClick={() => router.push("/chat")}>
            start now →
          </button>
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
                      <span style={s.prompt}>[guest@openvoxels]:</span>
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
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" },
  noise: { position: "fixed", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`, pointerEvents: "none", zIndex: 0, opacity: 0.4 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--border)", position: "relative", zIndex: 10 },
  logo: { fontSize: "16px", fontWeight: "700", color: "#e0e0e0", letterSpacing: "-0.3px" },
  headerBtn: { background: "none", border: "1px solid var(--border2)", color: "var(--text-dim)", fontFamily: "var(--font)", fontSize: "12px", padding: "6px 14px", cursor: "pointer", borderRadius: "2px" },
  main: { flex: 1, display: "flex", gap: "40px", padding: "40px 24px", alignItems: "center", position: "relative", zIndex: 10, justifyContent: "center", flexWrap: "wrap" },
  heroLeft: { flex: "0 0 420px", animation: "fadeUp 0.6s ease both" },
  eyebrow: { fontSize: "10px", color: "var(--green)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px" },
  title: { display: "flex", flexDirection: "column", marginBottom: "16px" },
  titleMain: { fontSize: "48px", fontWeight: "700", color: "#e8e8e8", lineHeight: 1.1, letterSpacing: "-1px" },
  titleSub: { fontSize: "48px", fontWeight: "300", color: "var(--text-dim)", lineHeight: 1.1, letterSpacing: "-1px", fontStyle: "italic" },
  desc: { fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "24px", maxWidth: "380px" },
  pipeline: { marginBottom: "28px", padding: "12px", border: "1px solid var(--border)", borderRadius: "4px", background: "var(--surface)", fontSize: "11px" },
  pipelineRow: { display: "flex", gap: "4px", flexWrap: "wrap" },
  pipeChip: { fontSize: "10px", color: "var(--text-dim)", border: "1px solid var(--border2)", padding: "3px 8px", borderRadius: "2px", background: "var(--surface2)", animation: "fadeIn 0.4s ease both" },
  pipeChipSuper: { color: "var(--green)", borderColor: "var(--green-dim)", background: "var(--green-dim)" },
  pipeArrow: { fontSize: "10px", color: "var(--text-muted)", margin: "6px 0" },
  pipeResult: { fontSize: "11px", color: "#888" },
  ctaPrimary: { background: "#e8e8e8", color: "#080808", border: "none", fontFamily: "var(--font)", fontSize: "12px", fontWeight: "600", padding: "10px 20px", cursor: "pointer", borderRadius: "2px" },
  heroRight: { flex: "1", minWidth: "360px", animation: "fadeUp 0.6s ease 0.2s both" },
  terminalWindow: { border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", background: "var(--surface)", boxShadow: "0 0 60px rgba(0,0,0,0.5)" },
  terminalBar: { background: "var(--surface2)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", gap: "12px" },
  terminalDots: { display: "flex", gap: "6px" },
  dot: { width: "10px", height: "10px", borderRadius: "50%", display: "block" },
  terminalTitle: { fontSize: "11px", color: "var(--text-muted)", flex: 1, textAlign: "center" },
  terminalBody: { padding: "16px", minHeight: "260px", maxHeight: "360px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" },
  terminalLine: { fontSize: "11px", lineHeight: 1.6, animation: "fadeIn 0.2s ease" },
  prompt: { color: "var(--green)" },
  promptText: { color: "#e0e0e0" },
  thinking: { color: "var(--text-muted)", fontStyle: "italic" },
  outputLabel: { color: "#888" },
  outputText: { color: "var(--text)" },
  cursor: { color: "var(--green)", animation: "blink 1s step-end infinite" },
  statsBar: { display: "flex", borderTop: "1px solid var(--border)", position: "relative", zIndex: 10 },
  stat: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "16px", borderRight: "1px solid var(--border)", gap: "4px" },
  statVal: { fontSize: "18px", fontWeight: "700", color: "#d0d0d0" },
  statLabel: { fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.05em" },
};
