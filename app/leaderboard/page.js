"use client";

import { useEffect, useState } from "react";
import SiteNav from "../SiteNav";
import Loader from "../Loader";

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

export default function LeaderboardPage() {
  const [rows, setRows] = useState(null);
  const [me, setMe] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("wealth");

  useEffect(() => {
    setRows(null);
    const url =
        tab === "experts"
        ? `${API}/api/leaderboard/experts`
        : `${API}/api/leaderboard`;
    fetch(url)
        .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
        })
        .then(setRows)
        .catch((e) => setErr(e.message || "Failed"));
    }, [tab]);

  if (err) return <p className="muted market-page">{err}</p>;
  if (!rows) {
    return (
      <>
        <SiteNav />
        <Loader label="Loading leaderboard" />
      </>
    );
  }

  const top = rows.slice(0, 3);
  const rest = rows.slice(3);
  const podium = [top[1], top[0], top[2]].filter(Boolean);

  return (
    <>
      <SiteNav />
      <main className="board">
        <section className="port-hero">
          <p className="home-kicker">Season standings</p>
          <h1>Leaderboard</h1>
          <p>
            {tab === "wealth"
                ? "Ranked by total tokens (wallet + tokens in open trades). Nav shows spendable only."
                : "Ranked by how often a trader was right after a market is resolved."}
            </p>
            <nav className="cats board-tabs">
            <button
                type="button"
                className={tab === "wealth" ? "cat-active" : ""}
                onClick={() => setTab("wealth")}
            >
                Wealth
            </button>
            <button
                type="button"
                className={tab === "experts" ? "cat-active" : ""}
                onClick={() => setTab("experts")}
            >
                Experts
            </button>
            </nav>
        </section>

        {rows.length === 0 && <p className="muted">No traders yet.</p>}

        {top.length > 0 && (
          <div className="board-podium">
            {podium.map((r) => (
              <article
                key={r.rank}
                className={`board-pod board-pod-${r.rank}${me && r.username === me ? " me" : ""}`}
              >
                <span className="board-medal">#{r.rank}</span>
                <span className="user-avatar">{initials(r.username)}</span>
                <b>{r.username}</b>
                <strong>{formatTokens(r.tokens)}</strong>
                <small>
                {tab === "wealth"
                    ? `${formatTokens(r.available)} free${r.committed ? ` · ${formatTokens(r.committed)} in play` : ""}`
                    : `${r.available} won · ${r.committed} lost`}
                </small>
              </article>
            ))}
          </div>
        )}

        {rest.length > 0 && (
          <ol className="board-list">
            {rest.map((r) => (
              <li
                key={r.rank + "-" + r.username}
                className={me && r.username === me ? "me" : ""}
              >
                <span className="board-rank">{r.rank}</span>
                <span className="user-avatar">{initials(r.username)}</span>
                <span className="board-who">
                  <b>{r.username}</b>
                  <small>
                    {formatTokens(r.available)} free
                    {r.committed ? ` · ${formatTokens(r.committed)} in play` : ""}
                  </small>
                </span>
                <span className="board-tok">{formatTokens(r.tokens)}</span>
              </li>
            ))}
          </ol>
        )}
      </main>
    </>
  );
}