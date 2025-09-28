import React from "react";
import { useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "../api.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <header className="header">
        <strong>Assistant Console</strong>
        <button className="button ghost" onClick={handleLogout}>
          Switch account (Back to login)
        </button>
      </header>
      <div className="wrap">
        <div className="card-lite">
          <h3>Welcome</h3>
          <p>Signed in as <b>{user?.email ?? "unknown"}</b>.</p>
        </div>
      </div>
    </>
  );
}
