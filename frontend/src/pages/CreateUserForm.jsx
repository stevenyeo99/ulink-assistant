// src/pages/CreateUserForm.jsx
import React, { useState } from "react";
import { adminCreateUser } from "../api.js";

export default function CreateUserForm({ assistants = [] }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAssistants, setSelectedAssistants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  function toggleAssistant(id) {
    setSelectedAssistants(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setMsg(null);
    if (!username.trim() || !password) {
      setMsg({ type: "error", text: "Fill username and password" });
      return;
    }
    setLoading(true);
    try {
      await adminCreateUser({
        username: username.trim(),
        password,
        assistantIds: selectedAssistants
      });
      setMsg({ type: "success", text: "User created" });
      setUsername("");
      setPassword("");
      setSelectedAssistants([]);
      // optionally emit an event or refresh user list via local event bus — UserList polls itself
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Failed to create user" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="stack">
      <label>Username</label>
      <input className="input" value={username} onChange={e => setUsername(e.target.value)} />

      <label>Password</label>
      <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} />

      <label>Assign Assistants (optional)</label>
      <div style={{ display: "grid", gap: 6, maxHeight: 140, overflow: "auto", padding: 6, borderRadius: 8, border: "1px dashed #e6eaf1" }}>
        {assistants.length === 0 ? (
          <div className="muted">No assistants available</div>
        ) : assistants.map(a => (
          <label key={a.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={selectedAssistants.includes(a.key)} onChange={() => toggleAssistant(a.key)} />
            <span>{a.name}</span>
          </label>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="button primary" type="submit" disabled={loading}>{loading ? "Creating..." : "Create user"}</button>
      </div>

      {msg && <div className={msg.type === "error" ? "muted" : ""} style={{ marginTop: 8, color: msg.type === "error" ? "#b00020" : "#0b9738" }}>{msg.text}</div>}
    </form>
  );
}
