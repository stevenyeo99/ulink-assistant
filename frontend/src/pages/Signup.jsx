import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api.js";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await register(email, password);
      navigate("/login");
    } catch (err) {
      setError(err.message || "Signup failed");
    }
  }

  return (
    <div className="center-screen">
      <div className="card" style={{ maxWidth: 420 }}>
        <div className="logo-ring" />
        <h2 className="form-title">Create an account</h2>

        <form className="stack" onSubmit={onSubmit}>
          <label>Email</label>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />

          <label>Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />

          {error && <div style={{ color: "crimson" }}>{error}</div>}

          <button className="button primary" type="submit">Sign up</button>
        </form>

        <div className="row" style={{ marginTop: 10 }}>
          <Link to="/login" className="button ghost">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
