"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMessage("...");
    const res = await fetch(`${API}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage("Error: " + JSON.stringify(data));
      return;
    }
    localStorage.setItem("token", data.token);
    setMessage("Registered. Token saved.");
  }

  return (
    <main className="auth">
      <h1>Register</h1>
      <form onSubmit={onSubmit}>
        <p>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        </p>
        <p>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </p>
        <p>
          <input type="password" placeholder="Password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </p>
        <button type="submit">Create account</button>
      </form>
      <p>{message}</p>
      <p><a href="/login">Login</a></p>
    </main>
  );
}