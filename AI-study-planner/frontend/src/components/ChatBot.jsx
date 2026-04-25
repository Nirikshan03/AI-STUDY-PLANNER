import { useState, useRef, useEffect } from "react";
import "./ChatBot.css";

const suggestedQuestions = [
  "Explain Newton's second law with examples",
  "What is the difference between mitosis and meiosis?",
  "How does integration by parts work?",
  "Explain the concept of chemical bonding",
];

export default function ChatBot({ user, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hi ${user?.name?.split(" ")[0] || "there"}! 👋 I'm your AI tutor. Ask me anything about your subjects!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return;
    const question = text.trim();
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/chat/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question, userId: user?.id || 1 }),
      });

      let reply = "";
      if (res.ok) {
        const data = await res.json();
        // Backend now returns { answer: "..." }
        reply = data.answer || data || "";
        if (!reply) reply = "I couldn't generate a response. Please try again.";
      } else {
        let errText = "";
        try { errText = (await res.json()).error || ""; } catch { errText = await res.text(); }
        reply = errText || "Something went wrong. Please try again.";
      }
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Cannot connect to server. Make sure the backend is running.",
        },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chatbot">
      <div className="chat-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="chat-avatar">🤖</div>
          <div>
            <div className="chat-title">AI Tutor</div>
            <div className="chat-status">● Online</div>
          </div>
        </div>
        <button className="chat-close" onClick={onClose}>✕</button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            {msg.role === "assistant" && <div className="msg-avatar">🤖</div>}
            <div className="msg-bubble">
              {msg.text.split("\n").map((line, j) => (
                <span key={j}>
                  {line}
                  <br />
                </span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant">
            <div className="msg-avatar">🤖</div>
            <div className="msg-bubble typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="suggested-questions">
          {suggestedQuestions.map((q) => (
            <button key={q} className="suggested-q" onClick={() => sendMessage(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask any doubt..."
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
