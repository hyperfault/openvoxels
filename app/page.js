"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "openvoxels. is ready.\nask me anything.",
      tier: null,
    },
  ]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    const newHistory = [...history, { role: "user", content: userMessage }];
    setHistory(newHistory);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: newHistory }),
      });

      const data = await res.json();
      const aiResponse = data.response || data.error || "something went wrong.";

      setHistory((prev) => [...prev, { role: "assistant", content: aiResponse }]);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiResponse,
          tier: data.tier,
          workerCount: data.workerCount,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "pipeline error. try again.", tier: null },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const tierLabel = (tier, count) => {
    if (!tier) return null;
    return "tier " + tier + " · " + count + " worker" + (count !== 1 ? "s" : "");
  };

  return (
    <div style={styles.container}>
    <div style={styles.header}>
    <span style={styles.logo}>openvoxels.</span>
    <span style={styles.subtitle}>synthesis ensemble</span>
    </div>

    <div style={styles.messages}>
    {messages.map((msg, i) => (
      <div
      key={i}
      style={{
        ...styles.message,
        ...(msg.role === "user" ? styles.userMsg : styles.assistantMsg),
      }}
      >
      <div style={styles.msgRole}>
      {msg.role === "user" ? "you" : "openvoxels."}
      </div>
      <div style={styles.msgContent}>
      <ReactMarkdown>{msg.content}</ReactMarkdown>
      </div>
      {msg.tier && (
        <div style={styles.tierBadge}>
        {tierLabel(msg.tier, msg.workerCount)}
        </div>
      )}
      </div>
    ))}

    {loading && (
      <div style={{ ...styles.message, ...styles.assistantMsg }}>
      <div style={styles.msgRole}>openvoxels.</div>
      <div style={styles.thinking}>
      <span style={styles.dot} />
      <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
      <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
      </div>
      </div>
    )}

    <div ref={bottomRef} />
    </div>

    <div style={styles.inputArea}>
    <textarea
    style={styles.input}
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={handleKey}
    placeholder="ask anything..."
    rows={1}
    disabled={loading}
    />
    <button
    style={{
      ...styles.sendBtn,
      opacity: loading || !input.trim() ? 0.3 : 1,
    }}
    onClick={sendMessage}
    disabled={loading || !input.trim()}
    >
    ↵
    </button>
    </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    maxWidth: "760px",
    margin: "0 auto",
    padding: "0 16px",
  },
  header: {
    display: "flex",
    alignItems: "baseline",
    gap: "16px",
    padding: "24px 0 16px",
    borderBottom: "1px solid #1a1a1a",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#e8e8e8",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "11px",
    color: "#444",
    letterSpacing: "0.05em",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 0",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  message: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  userMsg: {},
  assistantMsg: {},
  msgRole: {
    fontSize: "10px",
    color: "#444",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  msgContent: {
    fontSize: "14px",
    lineHeight: "1.7",
    color: "#e8e8e8",
  },
  tierBadge: {
    fontSize: "10px",
    color: "#7fff7f",
    letterSpacing: "0.05em",
    marginTop: "4px",
  },
  thinking: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    height: "20px",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#333",
    animation: "pulse 1s ease-in-out infinite",
  },
  inputArea: {
    display: "flex",
    gap: "8px",
    padding: "16px 0 24px",
    borderTop: "1px solid #1a1a1a",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    background: "#111",
    border: "1px solid #222",
    borderRadius: "6px",
    color: "#e8e8e8",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "14px",
    padding: "12px 14px",
    resize: "none",
    outline: "none",
    lineHeight: "1.5",
  },
  sendBtn: {
    background: "#7fff7f",
    border: "none",
    borderRadius: "6px",
    color: "#0a0a0a",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "18px",
    fontWeight: "700",
    width: "44px",
    height: "44px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
};
