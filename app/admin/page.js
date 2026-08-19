"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AdminPage() {
  const [view, setView] = useState("login");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [markets, setMarkets] = useState([]);
  const [form, setForm] = useState({
    question: "",
    category: "Sports",
    closes_at: "",
    resolution_rules: "",
    resolution_source: "",
    b: "150",
    status: "open",
  });

  function token() {
    return localStorage.getItem("token");
  }

  async function loadMe() {
    const t = token();
    if (!t) {
      setView("login");
      return;
    }
    const res = await fetch(`${API}/api/user`, {
      headers: { Accept: "application/json", Authorization: "Bearer " + t },
    });
    const user = await res.json();
    if (!res.ok || !user.is_admin) {
      localStorage.removeItem("token");
      setView("login");
      setMessage("Admin login required");
      return;
    }
    setView("dash");
    loadMarkets();
  }

  async function loadMarkets() {
    const res = await fetch(`${API}/api/admin/markets`, {
      headers: { Accept: "application/json", Authorization: "Bearer " + token() },
    });
    if (res.ok) setMarkets(await res.json());
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function onLogin(e) {
    e.preventDefault();
    setMessage("");
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage("Login failed");
      return;
    }
    if (!data.user.is_admin) {
      setMessage("This account is not admin");
      return;
    }
    localStorage.setItem("token", data.token);
    setView("dash");
    loadMarkets();
  }

  function setField(k, v) {
    setForm({ ...form, [k]: v });
  }

  async function onCreate(e) {
    e.preventDefault();
    const res = await fetch(`${API}/api/admin/markets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + token(),
      },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(JSON.stringify(data));
      return;
    }
    setMessage("Created #" + data.id);
    setView("dash");
    loadMarkets();
  }

  function logout() {
    localStorage.removeItem("token");
    setView("login");
  }

  if (view === "login") {
    return (
      <main className="auth">
        <p><Link href="/">Site home</Link></p>
        <h1>Admin login</h1>
        <form onSubmit={onLogin}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">Login</button>
        </form>
        <p>{message}</p>
      </main>
    );
  }

  if (view === "create") {
    return (
      <main className="auth">
        <p>
          <button type="button" onClick={() => setView("dash")}>Back to dashboard</button>
        </p>
        <h1>New market</h1>
        <form onSubmit={onCreate}>
          <input placeholder="Question" value={form.question} onChange={(e) => setField("question", e.target.value)} required />
          <select value={form.category} onChange={(e) => setField("category", e.target.value)}>
            <option>Finance</option>
            <option>Sports</option>
            <option>Technology</option>
            <option>Entertainment</option>
            <option>Current affairs</option>
          </select>
          <input type="datetime-local" value={form.closes_at} onChange={(e) => setField("closes_at", e.target.value)} required />
          <input placeholder="Resolution rules" value={form.resolution_rules} onChange={(e) => setField("resolution_rules", e.target.value)} required />
          <input placeholder="Source" value={form.resolution_source} onChange={(e) => setField("resolution_source", e.target.value)} required />
          <select value={form.b} onChange={(e) => setField("b", e.target.value)}>
            <option value="100">b = 100</option>
            <option value="150">b = 150</option>
            <option value="500">b = 500</option>
          </select>
          <select value={form.status} onChange={(e) => setField("status", e.target.value)}>
            <option value="draft">draft</option>
            <option value="open">open</option>
          </select>
          <button type="submit">Create</button>
        </form>
        <p>{message}</p>
      </main>
    );
  }

  return (
    <main className="admin-dash">
      <header className="nav">
        <span className="logo">Admin</span>
        <div>
          <button type="button" className="btn-green" onClick={() => setView("create")}>
            Add market
          </button>
          <button type="button" onClick={logout}>Logout</button>
        </div>
      </header>
      <h1>Dashboard</h1>
      <p>{message}</p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Question</th>
            <th>Category</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((m) => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td>{m.question}</td>
              <td>{m.category}</td>
              <td>{m.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}