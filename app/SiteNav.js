"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return String(name || "U").slice(0, 2).toUpperCase();
}

function formatTokens(n) {
  return Number(n || 0).toLocaleString();
}

export default function SiteNav() {
  const pathname = usePathname() || "/";
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

  function logout() {
    localStorage.removeItem("token");
    setWallet(null);
    setUsername("");
    setIsAdmin(false);
  }

  const onMarkets = pathname === "/" || pathname.startsWith("/markets");
  const onPortfolio = pathname.startsWith("/portfolio");
  const onBoard = pathname.startsWith("/leaderboard");
  const onAdmin = pathname.startsWith("/admin");

  return (
    <header className="nav">
      <div className="nav-left">
        <Link href="/" className="logo">
          <span className="logo-mark" aria-hidden="true" />
          Polypredict
        </Link>
        <nav className="nav-links">
          <Link href="/" className={`nav-link${onMarkets ? " on" : ""}`}>
            Markets
          </Link>
          <Link href="/leaderboard" className={`nav-link${onBoard ? " on" : ""}`}>
            Leaderboard
          </Link>
          {wallet && (
            <Link href="/portfolio" className={`nav-link${onPortfolio ? " on" : ""}`}>
              Portfolio
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/dashboard" className={`nav-link${onAdmin ? " on" : ""}`}>
              Admin
            </Link>
          )}
        </nav>
      </div>

      <div className="nav-right">
        {wallet ? (
          <div className="nav-dock">
            <Link href="/portfolio" className="token-chip" title="Available balance">
              <span className="token-orb" aria-hidden="true" />
              <span className="token-copy">
                <span className="token-value">{formatTokens(wallet.available)}</span>
                <span className="token-label">tokens</span>
              </span>
            </Link>
            <span className="nav-dock-split" aria-hidden="true" />
            <Link href="/portfolio" className="user-chip" title="Open portfolio">
              <span className="user-avatar">{initials(username || "U")}</span>
              <span className="user-meta">
                <span className="user-name">{username || "Trader"}</span>
                <span className="user-role">{isAdmin ? "Admin" : "Trader"}</span>
              </span>
            </Link>
            <span className="nav-dock-split" aria-hidden="true" />
            <button type="button" className="btn-logout" onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="nav-auth">
            <Link href="/user/login" className="btn-alt">
              Log in
            </Link>
            <Link href="/register" className="btn-green">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
