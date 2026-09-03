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

export default function PortfolioPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [claimMsg, setClaimMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErr("login");
      return;
    }
    fetch(`${API}/api/portfolio`, {
      headers: { Accept: "application/json", Authorization: "Bearer " + token },
    })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  function claimedToday() {
    const t = data?.wallet?.last_claim_at;
    if (!t) return false;
    return new Date(t).toDateString() === new Date().toDateString();
  }

  async function claimDaily() {
    setClaimMsg("");
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/api/wallet/claim`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + token,
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setClaimMsg(body.message || "Could not claim");
      return;
    }
    setData({ ...data, wallet: body });
    setClaimMsg("You got 50 tokens.");
  }

  if (err === "login") {
    return (
      <>
        <SiteNav />
        <main className="portfolio">
          <div className="port-empty">
            <h1>Your book is locked</h1>
            <p>Log in to see tokens, open positions, and payouts.</p>
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
        <Loader label="Loading portfolio" />
      </>
    );
  }

  const w = data.wallet || {};
  const rows = data.positions || [];
  const available = Number(w.available) || 0;
  const committed = Number(w.committed) || 0;
  const total = Math.max(available + committed, 1);
  const maxPayout = rows.reduce((sum, p) => sum + (Number(p.max_payout) || 0), 0);

  return (
    <>
      <SiteNav />
      <main className="portfolio">
        <section className="port-hero">
          <p className="home-kicker">Your positions</p>
          <h1>Portfolio</h1>
          <p>Track tokens in play, average entry, and what each contract can pay if you are right.</p>
        </section>

        <div className="port-stats">
          <article className="port-stat">
            <span>Available</span>
            <b>{formatCount(available)}</b>
          </article>
          <article className="port-stat">
            <span>In trades</span>
            <b>{formatCount(committed)}</b>
          </article>
          <article className="port-stat">
            <span>Open positions</span>
            <b>{rows.length}</b>
          </article>
          <article className="port-stat">
            <span>Max payout</span>
            <b>{formatCount(maxPayout)}</b>
          </article>
        </div>

        <div className="port-alloc" aria-hidden="true">
          <div className="port-alloc-bar">
            <span style={{ width: `${(available / total) * 100}%` }} />
          </div>
          <div className="port-alloc-legend">
            <span>Free {Math.round((available / total) * 100)}%</span>
            <span>Committed {Math.round((committed / total) * 100)}%</span>
          </div>
        </div>

        <div className="port-section">
          <h2>Daily reward</h2>
          <p className="muted">Once per day: +50 tokens. Virtual tokens only.</p>
          <button
            type="button"
            className="btn-green"
            disabled={claimedToday()}
            onClick={claimDaily}
          >
            {claimedToday() ? "Claimed today" : "Claim 50 tokens"}
          </button>
          {claimMsg && <p className="muted">{claimMsg}</p>}
        </div>

        <div className="port-section">
          <h2>Open positions</h2>
          {rows.length === 0 ? (
            <div className="port-empty">
              <p>No open positions yet. Buy YES or NO on a live market.</p>
              <Link href="/" className="btn-claim">
                Browse markets
              </Link>
            </div>
          ) : (
            <div className="market-grid">
              {rows.map((p, i) => {
                const yes = String(p.outcome).toLowerCase() === "yes";
                return (
                  <Link
                    href={`/markets/${p.market_id}`}
                    className="card pos-card"
                    key={p.id}
                    style={{ "--i": i }}
                  >
                    <div className="card-head">
                      <span className="card-cat">{p.market?.category || "Market"}</span>
                      <span className={yes ? "pct-yes" : "pct-no"}>
                        <span className="pct-k">{yes ? "YES" : "NO"}</span>
                      </span>
                    </div>
                    <h2>{p.market?.question || "Market"}</h2>
                    <div className="pos-metrics">
                      <span>
                        <small>Shares</small>
                        <b>{Number(p.shares).toFixed(2)}</b>
                      </span>
                      <span>
                        <small>Avg</small>
                        <b>{p.avg_price}%</b>
                      </span>
                      <span>
                        <small>Spent</small>
                        <b>{formatCount(p.tokens_spent)}</b>
                      </span>
                      <span>
                        <small>Max pay</small>
                        <b>{formatCount(p.max_payout)}</b>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
