import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api.js";

export default function Login() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="center-screen">
      <div className="card" style={{ maxWidth: 420 }}>
        <div className="logo-ring" />
        <h2 className="form-title">Welcome to Ulink Assist</h2>
        <p className="form-sub">Sign in to continue</p>

        <form className="stack" onSubmit={onSubmit}>
          <label>Email</label>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />

          <label>Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />

          {error && <div style={{ color: "crimson" }}>{error}</div>}

          <button className="button primary" type="submit">Sign in</button>
        </form>

        <div className="row" style={{ marginTop: 10 }}>
          <span>New here?</span>
          <Link to="/signup" className="button ghost">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
