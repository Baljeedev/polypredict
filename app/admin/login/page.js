"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e) {
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
    window.location.assign(
        (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/admin/dashboard/"
    );
  }

  return (
    <main className="auth">
      <p><Link href="/">Site home</Link></p>
      <h1>Admin login</h1>
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
    </main>
  );
}