"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import apiBase from "./apiBase";
import ClaimPopup from "./ClaimPopup";

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

function claimedToday(wallet) {
  const t = wallet?.last_claim_at;
  if (!t) return false;
  return new Date(t).toDateString() === new Date().toDateString();
}

export default function SiteNav() {
  const pathname = usePathname() || "/";
  const [wallet, setWallet] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setReady(true);
      return;
    }

    async function readJson(r) {
      const text = await r.text();
      if (!r.ok || !text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    }

    const API = apiBase();
    const headers = {
      Accept: "application/json",
      Authorization: "Bearer " + token,
    };

    Promise.all([
      fetch(`${API}/api/wallet`, { headers })
        .then(readJson)
        .then(setWallet)
        .catch(() => null),
      fetch(`${API}/api/user`, { headers })
        .then(readJson)
        .then((u) => {
          if (!u) return;
          setIsAdmin(!!u.is_admin);
          setUsername(u.username || u.name || "");
        })
        .catch(() => null),
    ]).finally(() => setReady(true));
  }, []);

  async function claimDaily() {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(apiBase() + "/api/wallet/claim", {
      method: "POST",
      headers: { Accept: "application/json", Authorization: "Bearer " + token },
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) setWallet(body);
  }

  function logout() {
    localStorage.removeItem("token");
    window.location.assign((process.env.NEXT_PUBLIC_BASE_PATH || "") + "/");
  }

  const onMarkets = pathname === "/" || pathname.startsWith("/markets");
  const onPortfolio = pathname.startsWith("/portfolio");
  const onProfile = pathname.startsWith("/profile");
  const onBoard = pathname.startsWith("/leaderboard");
  const onTraders = pathname.startsWith("/traders");
  const onAdmin = pathname.startsWith("/admin");
  const showUserNav = ready && !isAdmin && (wallet || username);

  const links = (
    <>
      <Link href="/" className={`nav-link${onMarkets ? " on" : ""}`}>
        Markets
      </Link>
      <Link href="/leaderboard" className={`nav-link${onBoard ? " on" : ""}`}>
        Leaderboard
      </Link>
      <Link href="/traders" className={`nav-link${onTraders ? " on" : ""}`}>
        Search
      </Link>
      {showUserNav && (
        <>
          <Link href="/portfolio" className={`nav-link${onPortfolio ? " on" : ""}`}>
            Portfolio
          </Link>
          <Link href="/profile" className={`nav-link${onProfile ? " on" : ""}`}>
            Profile
          </Link>
        </>
      )}
      {isAdmin && (
        <Link href="/admin/dashboard" className={`nav-link${onAdmin ? " on" : ""}`}>
          Admin
        </Link>
      )}
    </>
  );

  return (
    <>
      <header className="nav">
        <div className="nav-left">
          <button
            type="button"
            className="nav-burger"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
          <Link href="/" className="logo">
            <span className="logo-mark" aria-hidden="true" />
            Polypredict
          </Link>
          <nav className="nav-links">{links}</nav>
        </div>

        <div className="nav-right">
          {!ready ? null : isAdmin ? (
            <div className="nav-auth">
              <Link href="/admin/dashboard" className="btn-alt">
                Admin console
              </Link>
            </div>
          ) : showUserNav ? (
            <div className="nav-dock">
              <Link href="/portfolio" className="token-chip" title="Available balance">
                <span className="token-orb" aria-hidden="true" />
                <span className="token-copy">
                  <span className="token-value">{formatTokens(wallet?.available)}</span>
                  <span className="token-label">tokens</span>
                </span>
              </Link>
              {wallet && !claimedToday(wallet) ? (
                <button type="button" className="btn-claim nav-claim" onClick={claimDaily}>
                  Claim 50
                </button>
              ) : null}
              <span className="nav-dock-split" aria-hidden="true" />
              <Link href="/profile" className="user-chip" title="Open profile">
                <span className="user-avatar">{initials(username || "U")}</span>
                <span className="user-meta">
                  <span className="user-name">{username || "Trader"}</span>
                  <span className="user-role">Trader</span>
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

      <div
        className={`nav-drawer-bg${menuOpen ? " on" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`nav-drawer${menuOpen ? " on" : ""}`}>
        <div className="nav-drawer-top">
          <span>Menu</span>
          <button type="button" className="nav-drawer-close" onClick={() => setMenuOpen(false)}>
            Close
          </button>
        </div>
        <nav className="nav-drawer-links">{links}</nav>
      </aside>

      <ClaimPopup />
    </>
  );
}