const ChatMessage = ({ message }) => {
  const isAI = message.role === "ai";

  return (
    <div className={`flex mb-3 ${isAI ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-xs px-4 py-2 text-sm leading-relaxed ${
          isAI
            ? "bg-gray-100 text-gray-800 rounded-tl rounded-br-xl rounded-bl-xl rounded-tr-xl"
            : "bg-green-700 text-white rounded-tr rounded-bl-xl rounded-br-xl rounded-tl-xl"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
};

export default ChatMessage;