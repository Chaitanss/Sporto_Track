import { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import useAI from "../../hooks/useAI";
import { aiChat } from "../../Services/api";

const ChatbotWidget = ({ playerContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `Hi ${
        playerContext?.name?.split(" ")[0] || "there"
      }! I'm your AI coach. Ask me anything about your performance, training or next match.`,
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const { loading, callAI } = useAI();

  // Auto scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Add user message immediately
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");

    // Call API
    const data = await callAI(aiChat, trimmed, playerContext);

    if (data?.reply) {
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } else {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, I couldn't respond right now. Try again." },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-7 right-7 w-14 h-14 bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl z-50 hover:bg-green-800 transition-colors"
        title="AI Coach"
      >
        {isOpen ? "✕" : "🤖"}
      </button>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div className="fixed bottom-24 right-7 w-80 h-[460px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="bg-green-700 px-4 py-3 text-white">
            <p className="font-semibold text-sm">AI Coach</p>
            <p className="text-xs text-green-200">Powered by Groq AI</p>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}

            {loading && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-100 text-gray-500 text-xs px-4 py-2 rounded-xl">
                  Coach is thinking...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="p-3 border-t border-gray-200 bg-white flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your coach..."
              disabled={loading}
              className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500 disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-green-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>

        </div>
      )}
    </>
  );
};

export default ChatbotWidget;