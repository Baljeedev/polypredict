"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SiteNav() {
  const [wallet, setWallet] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API}/api/wallet`, {
      headers: { Accept: "application/json", Authorization: "Bearer " + token },
    })
    .then((r) => (r.ok ? r.json() : null))
    .then(setWallet);

    fetch(`${API}/api/user`, {
    headers: { Accept: "application/json", Authorization: "Bearer " + token },
    })
    .then((r) => (r.ok ? r.json() : null))
    .then((u) => {
        if (!u) return;
        setIsAdmin(!!u.is_admin);
        setUsername(u.username || u.name || "");
    });

  }, []);

  return (
    <header className="nav">
      <div>
        <Link href="/" className="logo">Polypredict</Link>
        <Link href="/">Markets</Link>
      </div>
      <div>
        {wallet ? (
          <>
            {username && <span className="muted">{username}</span>}
            <span className="muted">{wallet.available} tokens</span>
            {isAdmin && <Link href="/admin">Admin</Link>}
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("token");
                setWallet(null);
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/register" className="btn-green">Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}