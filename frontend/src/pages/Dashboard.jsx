// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import '../components/utils/ChatUploadButton.css';

import {
  getToken, clearAuth, getUser,
  getBotName, listChatbots,
  listSessions, createSession, getSession,
  sendMessage, doExportChat
} from "../api.js";

// util component
import ChatUploadButton from '../components/utils/ChatUploadButton';
import { TypingDots } from '../components/utils/TypingDots.jsx';
import AdminPanel from "./AdminPanel.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  useEffect(() => { if (!getToken()) navigate("/login"); }, [navigate]);

  const [filteredBots, setFilteredBots] = useState([]);
  const [botKey, setBotKey] = useState("");
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  const [sendDisabled, setSendDisabled] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [showAdmin, setShowAdmin] = useState(false);

  const user = getUser();
  const isAdmin = (user?.username === "service") || !!user?.isAdmin;

  const onPickFiles = (files) => {
    const withIds = files.map(f => ({ id: crypto.randomUUID(), file: f }));
    setAttachments(prev => [...prev, ...withIds]);
  };

  const removeAttachment = (id) => setAttachments(prev => prev.filter(a => a.id !== id));

  useEffect(() => {
    if (!botKey) { setSessions([]); setSessionId(""); return; }
    (async () => {
      const doGetListSession = await listSessions(botKey);
      setSessions(doGetListSession);
    })();
  }, [botKey]);

  useEffect(() => { (async () => setFilteredBots(await listChatbots()) )(); }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [sessionId, sessions]);

  const currentSession = useMemo(() => (sessionId ? getSession(sessionId) : null), [sessionId, sessions]);

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
    setIsSending(true);
    setUploading(true);

    const text = input.trim();
    if ((!text && attachments?.length === 0 ) || !botKey || !sessionId) {
      setIsSending(false);
      setUploading(false);
      return;
    }

    setSendDisabled(true);
    const attachmentFiles = attachments.map(a => a.file);
    await sendMessage(botKey, sessionId, text, setIsTyping, setSessions, attachmentFiles);

    setAttachments([]);
    setUploading(false);
    setInput("");
    setSendDisabled(false);
    setIsSending(false);
  }

  async function doExportChatEvent() { await doExportChat(sessionId); }

  const btnSendDisabled = (!botKey || !sessionId || (!input.trim() && attachments?.length === 0));

  return (
    <div className="console-page">
      <div className="console-wrap">
        <div className="console-grid">
          {/* Left panel */}
          <aside className="sidebar">
            <div className="stack">
              <label style={{ fontWeight: 700 }}>Assistant</label>
              <select className="input" value={botKey} onChange={e => setBotKey(e.target.value)}>
                <option value="">— Select a Assistant —</option>
                {filteredBots.map(b => (<option key={b.key} value={b.key}>{b.name}</option>))}
              </select>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <button className="button ghost" disabled={!botKey} onClick={onNewChat}>New chat</button>
              </div>
            </div>

            <div style={{ fontWeight: 700, marginTop: 10 }}>History</div>
            <div className="history">
              {sessions.length === 0 ? <div className="muted">No chats yet.</div> : sessions.map(s => (
                <button key={s.id} className={"history-item" + (s.id === sessionId ? " active" : "")} onClick={() => setSessionId(s.id)}>
                  <div className="title">{s.title || "Untitled"}</div>
                  <div className="meta">{new Date(s.updatedAt).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </aside>

          {/* Right panel */}
          <section className="chat">
            <div className="chat-header">
              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <div className="logo-ring small" />
                <strong>{botKey ? getBotName(botKey, filteredBots) : "Pick a Assistant"}</strong>
              </div>

              <div className="row" style={{ gap: 8 }}>
                {isAdmin && <button className="button ghost" onClick={() => setShowAdmin(true)}>Admin Panel</button>}
                <button className="button ghost" onClick={() => { clearAuth(); navigate("/login"); }}>Logout</button>
                <button className="button ghost" disabled={!sessionId} onClick={doExportChatEvent}>Export Chat</button>
              </div>
            </div>

            <div className="chat-messages">
              {
                !botKey ? <div className="muted">Select a Assistant to start.</div> :
                !sessionId ? <div className="muted">Create a new chat or pick one from history.</div> :
                  (currentSession?.messages || []).map((m, index) => (
                    <div key={index} className={"bubble " + (m.role === "user" ? "user" : "assistant")}>
                      <div className="bubble-inner"><p>{m.content}</p></div>
                    </div>
                  ))
              }
              {isTyping && <TypingDots />}
              <div ref={endRef} />
            </div>

            <form className="composer" onSubmit={onSend}>
              <div className='upload-button-wrap'>
                <ChatUploadButton disabled={!botKey || !sessionId || sendDisabled || uploading} fileCount={attachments.length} onFiles={onPickFiles} />
              </div>

              <input className="input input-message" placeholder={!botKey ? "Choose a Assistant first" : "Type a message…"} value={input} onChange={e => setInput(e.target.value)} disabled={!botKey || !sessionId || sendDisabled || uploading} />
              <button className="button primary send-btn" disabled={btnSendDisabled || sendDisabled || uploading}>{isSending ? "Sending..." : "Send"}</button>

              <div className="attachments-row">
                {attachments.map(({ id, file }) => (
                  <div key={id} className="chip" title={file.name}>
                    <span className="chip-icon">📎</span>
                    <span className="chip-name">{file.name}</span>
                    <button type="button" className="chip-remove" onClick={() => removeAttachment(id)}>×</button>
                  </div>
                ))}
              </div>
            </form>
          </section>
        </div>
      </div>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
