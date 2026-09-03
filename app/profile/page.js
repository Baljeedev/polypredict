"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "../SiteNav";
import Loader from "../Loader";
import apiBase from "../apiBase";

const API = apiBase();

function formatCount(n) {
  return Number(n || 0).toLocaleString();
}

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

export default function ProfilePage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErr("login");
      return;
    }
    fetch(`${API}/api/profile`, {
      headers: { Accept: "application/json", Authorization: "Bearer " + token },
    })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  if (err === "login") {
    return (
      <>
        <SiteNav />
        <main className="profile-page">
          <div className="profile-empty">
            <h1>Profile is locked</h1>
            <p>Log in to see your name, tokens, and prediction history.</p>
            <Link href="/user/login" className="btn-green">
              Log in
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (err) {
    return (
      <>
        <SiteNav />
        <p className="muted market-page">{err}</p>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <SiteNav />
        <Loader label="Loading profile" />
      </>
    );
  }

  const u = data.user || {};
  const w = data.wallet || {};
  const rows = data.history || [];
  const badges = data.badges || [];
  const display = u.username || u.name || "Trader";

  return (
    <>
      <SiteNav />
      <main className="profile-page">
        <section className="profile-card">
          <span className="profile-avatar" aria-hidden="true">
            {initials(display)}
          </span>
          <div className="profile-id">
            <p className="home-kicker">Trader profile</p>
            <h1>{display}</h1>
            {u.name && u.username ? <p className="profile-name">{u.name}</p> : null}
            <p className="muted">{u.email}</p>
          </div>
        </section>

        <section className="profile-badges">
          <h2>Achievements</h2>
          {badges.length === 0 ? (
            <p className="muted">Win a resolved market to earn a category badge.</p>
          ) : (
            <ul>
              {badges.map((b) => (
                <li key={b.category} className={b.level === "Expert" ? "is-expert" : ""}>
                  <b>{b.category}</b>
                  <span>{b.level}</span>
                  <small>{b.rate}% · {b.won}/{b.total}</small>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="profile-stats">
          <article>
            <span>Available</span>
            <b>{formatCount(w.available)}</b>
            <small>tokens you can trade</small>
          </article>
          <article>
            <span>In trades</span>
            <b>{formatCount(w.committed)}</b>
            <small>locked in open markets</small>
          </article>
          <article>
            <span>Ad tokens</span>
            <b>{formatCount(w.ad_tokens)}</b>
            <small>from daily claim</small>
          </article>
          <article>
            <span>Predictions</span>
            <b>{rows.length}</b>
            <small>open, won, and lost</small>
          </article>
        </div>

        <section className="profile-history">
          <div className="profile-history-top">
            <h2>Prediction history</h2>
            <Link href="/portfolio" className="muted">
              Open positions →
            </Link>
          </div>
          {rows.length === 0 ? (
            <div className="profile-empty">
              <p>No trades yet. Buy YES or NO on a live market.</p>
              <Link href="/" className="btn-green">
                Browse markets
              </Link>
            </div>
          ) : (
            <ul className="profile-list">
              {rows.map((p) => {
                const yes = String(p.outcome).toLowerCase() === "yes";
                return (
                  <li key={p.id}>
                    <Link href={`/markets/${p.market_id}`} className="profile-row">
                      <div className="profile-row-main">
                        <b>{p.question || "Market"}</b>
                        <small>
                          {formatCount(p.shares)} shares · spent {formatCount(p.tokens_spent)} · to
                          win {formatCount(p.max_payout)}
                        </small>
                      </div>
                      <div className="profile-row-tags">
                        <span className={yes ? "pct-yes" : "pct-no"}>
                          {yes ? "YES" : "NO"}
                        </span>
                        <span className={`profile-status ${p.status}`}>{p.status}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
