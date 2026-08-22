"use client";

import { useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
  const [username, setUsername] = useState("");
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
      body: JSON.stringify({ name, username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage("Error: " + JSON.stringify(data));
      return;
    }
    localStorage.setItem("token", data.token);
    window.location.assign((process.env.NEXT_PUBLIC_BASE_PATH || "") + "/");
  }

  return (
    <main className="auth">
      <h1>Register</h1>
      <form onSubmit={onSubmit}>
        <p>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        </p>
        <p>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
        </p>
        <p>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
        </p>
        <p>
          <label>
            Password (min 8 characters)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
        </p>
        <button type="submit">Create account</button>
      </form>
      <p>{message}</p>
      <p className="auth-hint">Already registered?</p>
      <p>
        <Link href="/user/login" className="btn-alt">
          Login
        </Link>
      </p>
    </main>
  );
}