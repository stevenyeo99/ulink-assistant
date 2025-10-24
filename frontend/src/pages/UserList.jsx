// src/pages/UserList.jsx
import React, { useEffect, useState } from "react";
import { adminListUsers, adminDeleteUser, adminResetUserPassword } from "../api.js";

export default function UserList({ assistants = [] }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setUsers(await adminListUsers());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function doDelete(userId) {
    if (!confirm("Delete user? This cannot be undone.")) return;
    setProcessingId(userId);
    try {
      await adminDeleteUser(userId);
      await load();
    } catch (err) {
      alert(err.message || "Delete failed");
    } finally {
      setProcessingId(null);
    }
  }

  async function doReset(userId) {
    const pw = prompt("Enter new password for user (leave blank to cancel):");
    if (pw === null || pw === "") return;
    setProcessingId(userId);
    try {
      await adminResetUserPassword(userId, pw);
      alert("Password reset successful");
    } catch (err) {
      alert(err.message || "Reset failed");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div>
      {loading ? <div className="muted">Loading users…</div> : null}
      <div style={{ display: "grid", gap: 8 }}>
        {users.length === 0 && !loading ? <div className="muted">No users found.</div> : null}
        {users.map(u => (
          <div key={u._id || u.id} className="card-lite" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{u.username}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                Allowed assistants: { (u.allowedAssistantIds || []).map(id => (assistants.find(a => a.key === id)?.name || id)).join(", ") || "—" }
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="button ghost" disabled={processingId === u._id} onClick={() => doReset(u._id)}>Reset password</button>
              <button className="button ghost" disabled={processingId === u._id} onClick={() => doDelete(u._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
