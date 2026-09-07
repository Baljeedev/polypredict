"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "../SiteNav";
import Loader from "../Loader";
import apiBase from "../apiBase";

const API = apiBase();
const EXPERT_CATS = [
  { label: "All", value: "" },
  { label: "Finance", value: "Finance" },
  { label: "Sports", value: "Sports" },
  { label: "Technology", value: "Technology" },
  { label: "Entertainment", value: "Entertainment" },
  { label: "Current affairs", value: "Current affairs" },
];

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
  const [expertCat, setExpertCat] = useState("");

  useEffect(() => {
    setRows(null);
    let url = `${API}/api/leaderboard`;
    if (tab === "experts") {
      url = `${API}/api/leaderboard/experts`;
      if (expertCat) url += `?category=${encodeURIComponent(expertCat)}`;
    }
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(setRows)
      .catch((e) => setErr(e.message || "Failed"));
  }, [tab, expertCat]);

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
              ? "Ranked by total tokens (wallet + tokens in open trades)."
              : expertCat
                ? `Experts in ${expertCat} — how often they were right after resolve.`
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
          {tab === "experts" ? (
            <nav className="cats board-tabs">
              {EXPERT_CATS.map((c) => (
                <button
                  key={c.value || "all"}
                  type="button"
                  className={expertCat === c.value ? "cat-active" : ""}
                  onClick={() => setExpertCat(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </nav>
          ) : null}
        </section>

        {rows.length === 0 && (
          <p className="muted">
            {tab === "experts"
              ? "No experts here yet. Resolve a market in this category first."
              : "No traders yet."}
          </p>
        )}

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
                <strong>
                  {tab === "wealth" ? formatTokens(r.tokens) : r.tokens + "%"}
                </strong>
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
                  <b>
                    <Link href={`/traders?u=${encodeURIComponent(r.username)}`}>{r.username}</Link>
                  </b>
                  <small>
                    {tab === "wealth"
                      ? `${formatTokens(r.available)} free${r.committed ? ` · ${formatTokens(r.committed)} in play` : ""}`
                      : `${r.available} won · ${r.committed} lost`}
                  </small>
                </span>
                <span className="board-tok">
                  {tab === "wealth" ? formatTokens(r.tokens) : r.tokens + "%"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </main>
    </>
  );
}