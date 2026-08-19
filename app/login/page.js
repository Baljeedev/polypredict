"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMessage("...");
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage("Error: " + JSON.stringify(data));
      return;
    }
    localStorage.setItem("token", data.token);
    // setMessage("Logged in as " + data.user.email);
    window.location.href = "/";
  }

  return (
    <main className="auth">
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <p>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </p>
        <p>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </p>
        <button type="submit">Login</button>
      </form>
      <p>{message}</p>
      <p><a href="/register">Register</a></p>
    </main>
  );
}