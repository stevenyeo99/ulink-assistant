// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getToken, clearAuth,
  getBotName, listChatbots,
  listSessions, createSession, getSession,
  sendMessage,
  doExportChat
} from "../api.js";

// util component
import { TypingDots } from '../components/utils/TypingDots.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  useEffect(() => { if (!getToken()) navigate("/login"); }, [navigate]);

  // bots + filterable UI
  // const [bots, setBots] = useState(() => listChatbots());
  // const [botFilter, setBotFilter] = useState("");
  const [filteredBots, setFilteredBots] = useState([]);

  const [botKey, setBotKey] = useState("");
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  const [sendDisabled, setSendDisabled] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!botKey) { 
      setSessions([]); 
      setSessionId(""); 
      
      return; 
    }

    (async () => {
      const doGetListSession = await listSessions(botKey);
      setSessions(doGetListSession);
    })();

  }, [botKey]);

  useEffect(() => {
     (async () => {
        setFilteredBots(await listChatbots());
      })();
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [sessionId, sessions]);

  const currentSession = useMemo(
    () => (sessionId ? getSession(sessionId) : null),
    [sessionId, sessions]
  );

  async function onNewChat() {
    if (!botKey) return;
    const s = await createSession(botKey);
    setSessions(await listSessions(botKey));
    setSessionId(s.id);
    setSendDisabled(false);
    setInput("");
  }

  async function onSend(e) {
    e.preventDefault();

    const text = input.trim();
    if (!text || !botKey || !sessionId) return;
    
    setSendDisabled(true);
    await sendMessage(botKey, sessionId, text, setIsTyping, setSessions);
    setInput("");
    setSendDisabled(false);
  }

  async function doExportChatEvent() {
    await doExportChat(sessionId);
  }

  // function onRenameBot() {
  //   if (!botKey) return;
  //   const currentName = getBotName(botKey);
  //   const next = prompt("Rename chatbot (leave blank to reset to default):", currentName);
  //   if (next === null) return; // cancel
  //   setBotName(botKey, next);
  //   setBots(listChatbots(botFilter));
  // }

  const btnSendDisabled = (!botKey || !sessionId || !input.trim());

  return (
    <div className="console-page">
      <div className="console-wrap">
        <div className="console-grid">
          {/* Left panel: bot dropdown + history */}
          <aside className="sidebar">
            <div className="stack">
              <label style={{ fontWeight: 700 }}>Assistant</label>
              {/* TODO: not show this features at DAY1 */}
              {/* <input
                className="input"
                placeholder="Filter chatbots…"
                value={botFilter}
                onChange={e => setBotFilter(e.target.value)}
              /> */}
              <select
                className="input"
                value={botKey}
                onChange={e => setBotKey(e.target.value)}
              >
                <option value="">— Select a Assistant —</option>
                {filteredBots.map(b => (
                  <option key={b.key} value={b.key}>{b.name}</option>
                ))}
              </select>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <button className="button ghost" disabled={!botKey} onClick={onNewChat}>
                  New chat
                </button>
                {/* TODO: not show this features at DAY1 */}
                {/* <button className="button ghost" disabled={!botKey} onClick={onRenameBot}>
                  Rename
                </button> */}
              </div>
            </div>

            <div style={{ fontWeight: 700, marginTop: 10 }}>History</div>
            <div className="history">
              {sessions.length === 0 ? (
                <div className="muted">No chats yet.</div>
              ) : sessions?.map(s => (
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
                <strong>{botKey ? getBotName(botKey, filteredBots) : "Pick a Assistant"}</strong>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="button ghost" onClick={() => { clearAuth(); navigate("/login"); }}>
                  Logout
                </button>
                <button className="button ghost" disabled={!sessionId} onClick={doExportChatEvent}>
                  Export Chat
                </button>
              </div>
            </div>

            <div className="chat-messages">
              {
                !botKey ? (
                  <div className="muted">Select a Assistant to start.</div>
                ) : !sessionId ? 
                  (
                    <div className="muted">Create a new chat or pick one from history.</div>
                  ) : 
                  (
                    (
                      currentSession?.messages || []).map((m, index) => (
                        <div key={index} className={"bubble " + (m.role === "user" ? "user" : "assistant")}>
                          <div className="bubble-inner">
                            <p>{m.content}</p>
                          </div>
                        </div>
                      )
                    )
                  )
              }
              {isTyping && <TypingDots />}
              <div ref={endRef} />
            </div>

            <form className="composer">
              <input
                className="input input-message"
                placeholder={!botKey ? "Choose a Assistant first" : "Type a message…"}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={!botKey || !sessionId || sendDisabled}
              />

              <button className="button primary send-btn" disabled={btnSendDisabled || sendDisabled} onClick={onSend}>Send</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
