"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteNav from "../SiteNav";
import Loader from "../Loader";
import apiBase from "../apiBase";

const API = apiBase();

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

function TraderSearch() {
  const searchParams = useSearchParams();
  const u = searchParams.get("u") || "";
  const [q, setQ] = useState("");
  const [hits, setHits] = useState([]);
  const [profile, setProfile] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!u) {
      setProfile(null);
      return;
    }
    setErr("");
    setProfile(null);
    fetch(`${API}/api/traders/${encodeURIComponent(u)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Trader not found");
        return r.json();
      })
      .then(setProfile)
      .catch((e) => setErr(e.message));
  }, [u]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`${API}/api/traders?q=${encodeURIComponent(q.trim())}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setHits(Array.isArray(data) ? data : []))
        .catch(() => setHits([]));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  if (u && !profile && !err) {
    return <Loader label="Loading trader" />;
  }

  if (profile) {
    const person = profile.user || {};
    const badges = profile.badges || [];
    const rows = profile.history || [];
    const display = person.username || person.name;

    return (
      <main className="profile-page">
        <p>
          <Link href="/traders" className="muted">
            ← Search traders
          </Link>
        </p>
        <section className="profile-card">
          <span className="profile-avatar">{initials(display)}</span>
          <div className="profile-id">
            <p className="home-kicker">Trader profile</p>
            <h1>{display}</h1>
            {person.name ? <p className="profile-name">{person.name}</p> : null}
          </div>
        </section>
        <section className="profile-badges">
          <h2>Achievements</h2>
          {badges.length === 0 ? (
            <p className="muted">No category badges yet.</p>
          ) : (
            <ul>
              {badges.map((b) => (
                <li key={b.category} className={b.level === "Expert" ? "is-expert" : ""}>
                  <b>{b.category}</b>
                  <span>{b.level}</span>
                  <small>
                    {b.rate}% · {b.won}/{b.total}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="profile-history">
          <h2>Prediction history</h2>
          {rows.length === 0 ? (
            <p className="muted">No trades yet.</p>
          ) : (
            <ul className="profile-list">
              {rows.map((p) => (
                <li key={p.id}>
                  <Link href={`/markets/${p.market_id}`} className="profile-row">
                    <div className="profile-row-main">
                      <b>{p.question || "Market"}</b>
                    </div>
                    <div className="profile-row-tags">
                      <span className={p.outcome === "yes" ? "pct-yes" : "pct-no"}>
                        {(p.outcome || "").toUpperCase()}
                      </span>
                      <span className={`profile-status ${p.status}`}>{p.status}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="port-hero">
        <p className="home-kicker">Find traders</p>
        <h1>Search profiles</h1>
        <p className="muted">Look up a username and see their badges.</p>
      </section>
      <label className="mkt-amount">
        <span>Search</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type at least 2 letters"
        />
      </label>
      {err ? <p className="muted">{err}</p> : null}
      <ul className="profile-list">
        {hits.map((h) => (
          <li key={h.username}>
            <Link href={`/traders?u=${encodeURIComponent(h.username)}`} className="profile-row">
              <div className="profile-row-main">
                <b>{h.username}</b>
                <small>{h.name}</small>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function TradersPage() {
  return (
    <>
      <SiteNav />
      <Suspense fallback={<Loader label="Loading" />}>
        <TraderSearch />
      </Suspense>
    </>
  );
}