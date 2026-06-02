import React from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./styles.css";

const baseURL = (import.meta.env.VITE_BASE_URL || "http://localhost:5001").replace(/\/$/, "");
const API_URL = `${baseURL}/chat`;

function App() {
  const [messages, setMessages] = React.useState([
    {
      role: "assistant",
      content: "Hi. Ask me anything and I will keep the conversation context.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState("");
  const listRef = React.useRef(null);

  React.useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function sendMessage(event) {
    event.preventDefault();

    const content = input.trim();
    if (!content || isSending) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    setError("");

    try {
      const history = nextMessages.filter((message) => message.role !== "assistant" || message.content !== messages[0].content);
      const response = await axios.post(API_URL, { messages: history });
      setMessages((current) => [...current, response.data.message]);
    } catch (requestError) {
      const message =
        requestError.response?.data?.error || "Something went wrong. Check the backend terminal.";
      setError(message);
    } finally {
      setIsSending(false);
    }
  }

  function startNewChat() {
    setMessages([
      {
        role: "assistant",
        content: "Fresh chat started. What should we explore?",
      },
    ]);
    setError("");
    setInput("");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">SWE 2026</p>
          <h1>ChatGPT Clone</h1>
        </div>
        <button className="secondary-button" type="button" onClick={startNewChat}>
          New chat
        </button>
      </aside>

      <section className="chat-panel" aria-label="Chat conversation">
        <div className="message-list" ref={listRef}>
          {messages.map((message, index) => (
            <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
              <div className="avatar">{message.role === "user" ? "U" : "AI"}</div>
              <p>{message.content}</p>
            </article>
          ))}
          {isSending && (
            <article className="message assistant">
              <div className="avatar">AI</div>
              <p>Thinking...</p>
            </article>
          )}
        </div>

        {error && <p className="error">{error}</p>}

        <form className="composer" onSubmit={sendMessage}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                sendMessage(event);
              }
            }}
            placeholder="Message the assistant"
            rows="1"
          />
          <button type="submit" disabled={!input.trim() || isSending}>
            Send
          </button>
        </form>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
