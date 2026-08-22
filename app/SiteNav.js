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

    async function readJson(r) {
      const text = await r.text();
      if (!r.ok || !text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    }

    const headers = {
      Accept: "application/json",
      Authorization: "Bearer " + token,
    };

    fetch(`${API}/api/wallet`, { headers })
      .then(readJson)
      .then(setWallet);

    fetch(`${API}/api/user`, { headers })
      .then(readJson)
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
            {username && (
              <Link href="/portfolio">{username}</Link>
            )}
            <Link href="/portfolio">Portfolio</Link>
            <span className="muted">{wallet.available} tokens</span>
            {isAdmin && <Link href="/admin/dashboard">Admin</Link>}
            <button
              type="button"
              className="btn-alt"
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
            <Link href="/user/login" className="btn-alt">Log in</Link>
            <Link href="/register" className="btn-green">Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}