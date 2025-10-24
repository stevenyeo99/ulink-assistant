// src/pages/AdminPanel.jsx
import React, { useEffect, useState } from "react";
import CreateUserForm from "./CreateUserForm.jsx";
import UserList from "./UserList.jsx";
import { getToken, listChatbots } from "../api.js";

export default function AdminPanel({ onClose }) {
  const [assistants, setAssistants] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        setAssistants(await listChatbots());
      } catch (err) {
        console.error("Failed to load assistants", err);
      }
    })();
  }, []);

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0 }}>Admin Panel</h3>
          <div>
            <button className="button ghost" onClick={onClose}>Close</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 14, marginTop: 12 }}>
          <div style={{ padding: 12 }}>
            <h4 style={{ marginTop: 0 }}>Create User</h4>
            <CreateUserForm assistants={assistants} />
            <hr className="hr" />
            <h4>Users</h4>
            <UserList assistants={assistants} />
          </div>

          <aside className="card-lite" style={{ padding: 12 }}>
            <h4 style={{ marginTop: 0 }}>Info</h4>
            <p className="muted" style={{ marginBottom: 8 }}>
              Create users and assign them permission to access one or multiple assistants.
            </p>
            <p className="muted">Admin actions require a valid JWT in localStorage.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* Inline styles to keep component self-contained */
const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(11,18,32,.5)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
};

const panelStyle = {
  width: "min(1100px, 96%)", maxHeight: "88vh", overflow: "auto",
  background: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 18px 50px rgba(16,24,40,.16)",
};

const headerStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "6px 6px"
};
