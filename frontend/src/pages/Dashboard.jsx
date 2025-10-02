import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getToken, clearAuth,
  chatbots,
  listSessions, createSession, getSession,
  sendMessage, exportSessionText
} from "../api.js";

export default function Dashboard() {
  const navigate = useNavigate();

  // protect the route (extra guard, you already protect via router)
  useEffect(() => { if (!getToken()) navigate("/login"); }, [navigate]);

  const [botKey, setBotKey] = useState("");
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (!botKey) { setSessions([]); setSessionId(""); return; }
    setSessions(listSessions(botKey));
  }, [botKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessionId, sessions]);

  const currentSession = useMemo(() => sessionId ? getSession(sessionId) : null, [sessionId, sessions]);

  function onNewChat() {
    if (!botKey) return;
    const s = createSession(botKey);
    setSessions(listSessions(botKey));
    setSessionId(s.id);
    setInput("");
  }

  async function onSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !botKey || !sessionId) return;
    await sendMessage(botKey, sessionId, text);
    setInput("");
    setSessions(listSessions(botKey)); // refresh
  }

  function onDownload() {
    if (!sessionId) return;
    const text = exportSessionText(sessionId);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat_${sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="wrap" style={{ height: "100%" }}>
      <div className="console-grid">
        {/* Left panel: bot dropdown + history */}
        <aside className="sidebar">
          <div>
            <label style={{ fontWeight: 700 }}>Chatbot</label>
            <select className="input" value={botKey} onChange={e => setBotKey(e.target.value)}>
              <option value="">— Select a chatbot —</option>
              {chatbots.map(b => <option key={b.key} value={b.key}>{b.name}</option>)}
            </select>
            <button className="button ghost" style={{ marginTop: 8 }} disabled={!botKey} onClick={onNewChat}>
              New chat
            </button>
          </div>

          <div style={{ fontWeight: 700, marginTop: 10 }}>History</div>
          <div className="history">
            {sessions.length === 0 ? (
              <div className="muted">No chats yet.</div>
            ) : sessions.map(s => (
              <button key={s.id}
                className={"history-item" + (s.id === sessionId ? " active" : "")}
                onClick={() => setSessionId(s.id)}>
                <div className="title">{s.title || "Untitled"}</div>
                <div className="meta">{new Date(s.updatedAt).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* Right panel: chat window */}
        <section className="chat">
          <div className="chat-header">
            <div className="row" style={{ gap: 8, alignItems: "center" }}>
              <div className="logo-ring small" />
              <strong>{chatbots.find(b => b.key === botKey)?.name || "Pick a chatbot"}</strong>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="button ghost" onClick={() => { clearAuth(); navigate("/login"); }}>
                Switch account
              </button>
              <button className="button ghost" disabled={!sessionId} onClick={onDownload}>
                Download chat
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {!botKey ? (
              <div className="muted">Select a chatbot to start.</div>
            ) : !sessionId ? (
              <div className="muted">Create a new chat or pick one from history.</div>
            ) : (
              (currentSession?.messages || []).map(m => (
                <div key={m.id} className={"bubble " + (m.role === "user" ? "user" : "assistant")}>
                  <p>{m.content}</p>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <form className="composer" onSubmit={onSend}>
            <input
              className="input"
              placeholder={!botKey ? "Choose a chatbot first" : "Type a message…"}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!botKey || !sessionId}
            />
            <button className="button primary" disabled={!botKey || !sessionId || !input.trim()} type="submit">
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
