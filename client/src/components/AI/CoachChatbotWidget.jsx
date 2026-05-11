import { useState, useRef, useEffect } from "react";
import useAI from "../../hooks/useAI";
import { aiCoachChat } from "../../Services/api";

const CoachChatMessage = ({ message }) => {
  const isAI = message.role === "ai";
  return (
    <div className={`flex mb-3 ${isAI ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-xs px-4 py-2 text-sm leading-relaxed rounded-xl ${
          isAI
            ? "bg-gray-100 text-gray-800 rounded-tl-none"
            : "bg-green-800 text-white rounded-tr-none"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
};

const QUICK_PROMPTS = [
  "Who should play vs City Club?",
  "Which player needs rest?",
  "What's our strongest batting order?",
  "Who is our biggest injury risk?",
];

const CoachChatbotWidget = ({ squadContext }) => {
  const [isOpen, setIsOpen]   = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `Hi Coach ${squadContext?.coachName?.split(" ")[1] || ""}! I know your squad. Ask me anything — team selection, training, or tactics.`,
    },
  ]);
  const [input, setInput]   = useState("");
  const bottomRef           = useRef(null);
  const { loading, callAI } = useAI();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");

    const data = await callAI(aiCoachChat, trimmed, squadContext);

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

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-7 right-7 w-14 h-14 bg-green-800 text-white rounded-full shadow-xl flex items-center justify-center text-2xl z-50 hover:bg-green-900 transition-colors"
        title="Squad AI Assistant"
      >
        {isOpen ? "✕" : "🤖"}
      </button>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div className="fixed bottom-24 right-7 w-84 w-[340px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="bg-green-800 px-4 py-3 text-white">
            <p className="font-semibold text-sm">Squad AI Assistant</p>
            <p className="text-xs text-green-300">Powered by Groq AI · Squad-aware</p>
          </div>

          {/* Quick Prompts */}
          <div className="flex gap-1.5 p-2 overflow-x-auto border-b border-gray-100 bg-gray-50 flex-shrink-0">
            {QUICK_PROMPTS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="flex-shrink-0 text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded-lg hover:border-green-500 hover:text-green-700 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
            {messages.map((msg, i) => (
              <CoachChatMessage key={i} message={msg} />
            ))}

            {loading && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-100 text-gray-500 text-xs px-4 py-2 rounded-xl">
                  Analysing squad data...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about squad, tactics..."
              disabled={loading}
              className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-600 disabled:opacity-60"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="bg-green-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>

        </div>
      )}
    </>
  );
};

export default CoachChatbotWidget;