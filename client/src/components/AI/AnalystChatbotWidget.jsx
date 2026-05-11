import { useState, useRef, useEffect } from "react";
import useAI from "../../hooks/useAI";
import { aiAnalystChat } from "../../Services/api";

/* ══════════════════════════════════════════════════════════
   ANALYST CHATBOT WIDGET — sticky bottom-right, dark theme
══════════════════════════════════════════════════════════ */
const AnalystChatbotWidget = ({ analystContext }) => {
  const [isOpen, setIsOpen]   = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `Hey! I'm your Data AI. Ask me anything — "What's our average score in away matches?" or "Who has the best strike rate this season?"`,
    },
  ]);
  const [input, setInput]     = useState("");
  const bottomRef             = useRef(null);
  const { loading, callAI }   = useAI();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");

    const data = await callAI(
      (msg) => aiAnalystChat(msg, analystContext),
      trimmed
    );

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: data?.reply || "Sorry, I couldn't respond right now. Try again.",
      },
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const QUICK = [
    "Average score in away matches?",
    "Who has the best strike rate?",
    "Our win rate this season?",
    "Lowest fitness player?",
  ];

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: isOpen
            ? "linear-gradient(135deg,#1e3a5f,#0f2744)"
            : "linear-gradient(135deg,#00d4b4,#38bdf8)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          boxShadow: "0 4px 24px rgba(0,212,180,0.35)",
          zIndex: 9999,
          transition: "all 0.3s ease",
        }}
        title="Data AI Assistant"
      >
        {isOpen ? "✕" : "📊"}
      </button>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 96,
            right: 28,
            width: 340,
            height: 480,
            background: "linear-gradient(160deg,#0d1f33,#091520)",
            border: "1px solid #1e3a5f",
            borderRadius: 20,
            display: "flex",
            flexDirection: "column",
            zIndex: 9998,
            boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              background: "linear-gradient(90deg,#00d4b422,#38bdf811)",
              borderBottom: "1px solid #1e3a5f",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#00d4b4,#38bdf8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              📊
            </div>
            <div>
              <p
                style={{
                  color: "#e2e8f0",
                  fontWeight: 700,
                  fontSize: 13,
                  margin: 0,
                }}
              >
                Data Q&A AI
              </p>
              <p
                style={{
                  color: "#00d4b4",
                  fontSize: 10,
                  margin: 0,
                  letterSpacing: 1,
                }}
              >
                ● Powered by Groq
              </p>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "9px 13px",
                    borderRadius:
                      msg.role === "user"
                        ? "14px 14px 2px 14px"
                        : "14px 14px 14px 2px",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg,#00d4b4,#38bdf8)"
                        : "#111d33",
                    border:
                      msg.role === "user"
                        ? "none"
                        : "1px solid #1e3a5f",
                    color: msg.role === "user" ? "#060e1a" : "#cbd5e1",
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    fontWeight: msg.role === "user" ? 600 : 400,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    background: "#111d33",
                    border: "1px solid #1e3a5f",
                    borderRadius: "14px 14px 14px 2px",
                    padding: "9px 14px",
                    display: "flex",
                    gap: 4,
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#00d4b4",
                        opacity: 0.7,
                        animation: `bounce 1.2s ease ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                  <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions (only show at start) */}
          {messages.length === 1 && (
            <div
              style={{
                padding: "0 12px 10px",
                display: "flex",
                flexWrap: "wrap",
                gap: 5,
              }}
            >
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                  }}
                  style={{
                    background: "#111d33",
                    border: "1px solid #243352",
                    borderRadius: 8,
                    color: "#64748b",
                    fontSize: 10,
                    padding: "4px 9px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid #1e3a5f",
              display: "flex",
              gap: 8,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about stats, players, matches..."
              disabled={loading}
              style={{
                flex: 1,
                background: "#111d33",
                border: "1px solid #243352",
                borderRadius: 10,
                padding: "8px 12px",
                color: "#e2e8f0",
                fontSize: 12,
                outline: "none",
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                background:
                  loading || !input.trim()
                    ? "#1e3a5f"
                    : "linear-gradient(135deg,#00d4b4,#38bdf8)",
                border: "none",
                borderRadius: 10,
                padding: "8px 14px",
                color: loading || !input.trim() ? "#475569" : "#060e1a",
                fontWeight: 700,
                fontSize: 12,
                cursor:
                  loading || !input.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AnalystChatbotWidget;