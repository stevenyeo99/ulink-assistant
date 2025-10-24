// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import '../components/utils/ChatUploadButton.css';

import {
  getToken, clearAuth,
  getBotName, listChatbots,
  listSessions, createSession, getSession,
  sendMessage,
  doExportChat,
  getUser,
  doBackUpAllChat,
  appendMessage
} from "../api.js";

// util component
import ChatUploadButton from '../components/utils/ChatUploadButton';
import { TypingDots } from '../components/utils/TypingDots.jsx';
import LoadingSpinner from "../components/utils/LoadingSpinner.jsx";

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
  const [isSending, setIsSending] = useState(false);

  // upload field
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Loading Spinner
  const [loading, setLoading] = useState(false);

  const onPickFiles = (files) => {
    const withIds = files.map(f => ({ id: crypto.randomUUID(), file: f }));
    setAttachments(prev => [...prev, ...withIds]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }

  useEffect(() => {
    if (!botKey) { 
      setSessions([]); 
      setSessionId(""); 
      
      return; 
    } else {
      setSessionId('');
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

    // isFirstReply flag do trigger this (Assistant begin chat first)
    const currentAssistant = filteredBots.find(filter => filter.key === botKey);
    if (currentAssistant && currentAssistant?.isFirstReply) {
      await sendMessage(botKey, s.id, 'Hi', setIsTyping, setSessions, [], true);
    }
  }

  async function doExportAll() {
    const confirmBackup = window.confirm('Are you sure want backup, once backup all chat history will be uploaded into Zoho Work Drive & All History Records Deleted From System.');
    if (confirmBackup) {
      setLoading(true);

      // trigger the Export All Chat API
      await doBackUpAllChat({ setSessions, botKey });

      setLoading(false);

      alert('Chat Succesfully Backup into Zoho Work Drive.');

      return;
    } else {
      return;
    }
  }

  async function onSend(e) {
    e.preventDefault();
    setIsSending(true);
    setUploading(true);

    const text = input.trim();
    if ((!text && attachments?.length === 0 ) || !botKey || !sessionId) {
      return;
    }
    
    setSendDisabled(true);

    const attachmentFiles = attachments.map(a => a.file);
    await sendMessage(botKey, sessionId, text, setIsTyping, setSessions, attachmentFiles, false);

    setAttachments([]);
    setUploading(false);
    setInput("");
    setSendDisabled(false);
    setIsSending(false);
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

  const btnSendDisabled = (!botKey || !sessionId || (!input.trim() && attachments?.length === 0));

  const authUser = getUser();

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
              <div className="row">
                <button className="button ghost" disabled={!botKey} onClick={onNewChat}>
                  New chat
                </button>

                { authUser?.role === 'admin' && (
                  <button className='button ghost' onClick={doExportAll}>
                    Backup
                  </button>
                )}
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
              <div className='upload-button-wrap'>
                <ChatUploadButton disabled={!botKey || !sessionId || sendDisabled || uploading} fileCount={attachments.length} onFiles={onPickFiles} />
              </div>

              <input
                className="input input-message"
                placeholder={!botKey ? "Choose a Assistant first" : "Type a message…"}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={!botKey || !sessionId || sendDisabled || uploading}
              />

              <button className="button primary send-btn" disabled={btnSendDisabled || sendDisabled || uploading} onClick={onSend}>{isSending ? "Sending..." : "Send"}</button>

              {/* Inline attachment indicator row */}
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

      <LoadingSpinner show={loading} />
    </div>
  );
}
