import {
  API_BASE,
  LOGIN_PATH,
  REGISTER_PATH,
  PROFILE_PATH,
  GET_LIST_ASSISTANT_PATH,
  POST_SESSION_PATH,
  POST_STREAM_CHAT_PATH,
  GET_LIST_HISTORY_PATH,
  GET_LIST_MESSAGE_PER_SESSION_PATH,
  POST_CHAT_HIST_REPORT_PATH
} from './config';

// integration
import {
  getListOfAssistant
} from './integrations/assistant-integration';

import {
  postNewSession
} from './integrations/session-integration';

import {
  postChatStreamingAPI
} from './integrations/chat-integration';


// ====== Small HTTP helper ======
async function request(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ====== Auth storage ======
const LS_TOKEN = "ulink.auth.token";
const LS_USER  = "ulink.auth.user";

export function setAuth(token, user) {
  if (token) localStorage.setItem(LS_TOKEN, token);
  if (user)  localStorage.setItem(LS_USER, JSON.stringify(user));
}

export function getToken() { 
  return localStorage.getItem(LS_TOKEN) || ""; 
}

export function getUser() {
  try { 
    return JSON.parse(localStorage.getItem(LS_USER) || "null"); 
  }
  catch { 
    return null; 
  }
}

export function clearAuth() {
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_USER);
}

// ====== Auth API ======
export async function login(email, password) {
  const data = await request(LOGIN_PATH, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const token = data.token;
  const user  = data.user || (data.username ? { email, username: data.username } : { email });
  if (!token) throw new Error("No token in response");
  setAuth(token, user);
  return user;
}

export async function register(email, password) {
  const data = await request(REGISTER_PATH, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data;
}

export async function fetchProfile() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return request(PROFILE_PATH, {
    headers: { Authorization: `Bearer ${token}` },
  });
}



/* ====================================================================
   Chat console (frontend-only, localStorage) + Editable bot names
   ==================================================================== */

// Bot label storage (user edits)
const LS_BOT_LABELS = "ulink.chat.botLabels";
function loadBotLabels() {
  try { return JSON.parse(localStorage.getItem(LS_BOT_LABELS) || "{}"); }
  catch { return {}; }
}
function saveBotLabels(map) {
  localStorage.setItem(LS_BOT_LABELS, JSON.stringify(map || {}));
}

// Public helpers for UI
export async function listChatbots(filter = "") {
  const labels = loadBotLabels();

  const listOfAssistant = await getListOfAssistant();

  const out = listOfAssistant.map(b => {
    const assistMap = (
      {
        key: b._id,
        name: labels[b.key]?.trim() || b.displayName,
        defaultName: b.displayName,
      }
    );

    return assistMap;
  });

  if (!filter) return out;
  const q = filter.toLowerCase();

  return out.filter(b =>
    b.name.toLowerCase().includes(q) ||
    b.defaultName.toLowerCase().includes(q) ||
    b.key.toLowerCase().includes(q)
  );
}

export function getBotName(key, assistantList = []) {
  const lbl = loadBotLabels()[key];
  if (lbl && lbl.trim()) return lbl.trim();
  return assistantList.find(b => b.key === key)?.name || "Chatbot";
}

export function setBotName(key, newName) {
  const map = loadBotLabels();
  const trimmed = String(newName || "").trim();
  if (!trimmed) {
    // reset to default
    delete map[key];
  } else {
    map[key] = trimmed;
  }
  saveBotLabels(map);
  return listChatbots(); // convenience return
}

// ====== Chat sessions (localStorage) ======
const LS_CHAT = "ulink.chat.v1";
const uuid = () => (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));

function loadState() {
  try { 
    return JSON.parse(localStorage.getItem(LS_CHAT)) || { sessions: [] }; 
  }
  catch { 
    return { 
      sessions: [] 
    }; 
  }
}

function saveState(state) { 
  localStorage.setItem(LS_CHAT, JSON.stringify(state)); 
}

export function listSessions(botKey) {
  return loadState().sessions
    .filter(s => s.botKey === botKey)
    .sort((a, b) => (new Date(b.updatedAt)) - (new Date(a.updatedAt)));
}

export async function createSession(assistantId) {
  const state = loadState();
  const authUser = getUser();

  // Call Create Session API
  const newSessionBE = await postNewSession({
    assistantId,
    userId: authUser?.id
  });

  const session = {
    id: newSessionBE?.sessionId,
    botKey: assistantId,
    title: newSessionBE?.title,
    messages: [],
    createdAt: newSessionBE?.createdAt,
    updatedAt: newSessionBE?.updatedAt
  };

  state.sessions.push(session);
  saveState(state);
  return session;
}

export function getSession(id) {
  return loadState().sessions.find(s => s.id === id) || null;
}

export function appendMessage(sessionId, role, content) {
  const state = loadState();
  const session = state.sessions.find(s => s.id === sessionId);
  if (!session) return null;
  session.messages.push({ id: uuid(), role, content, ts: Date.now() });
  if (role === "user" && (!session.title || session.title === "New chat")) {
    session.title = content.slice(0, 60);
  }
  session.updatedAt = Date.now();
  saveState(state);
  return session;
}

// Demo reply for now — replace with real backend call later.
export async function sendMessage(botKey, sessionId, text) {
  appendMessage(sessionId, "user", text);
  
  const authUser = getUser();
  const userId = authUser?.id;

  // Call Chat Stream API
  const reply = await postChatStreamingAPI({
    assistantId: botKey,
    sessionId,
    message: text,
    userId
  });
  
  appendMessage(sessionId, "assistant", reply);
  
  return reply;
}

export function exportSessionText(sessionId) {
  const session = getSession(sessionId);
  if (!session) return "";
  const botName = getBotName(session.botKey);
  const lines = [
    `# Chat with ${botName}`,
    `Started: ${new Date(session.createdAt).toLocaleString()}`,
    "",
    ...session.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`),
  ];
  return lines.join("\n");
}
