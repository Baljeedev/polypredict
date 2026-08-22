"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "../SiteNav";
import Loader from "../Loader";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function PortfolioPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

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

  if (err === "login") {
    return (
      <>
        <SiteNav />
        <p className="muted market-page">
          <Link href="/login" className="btn-alt">Login</Link> to see your portfolio
        </p>
      </>
    );
  }
  if (err) return <p className="muted market-page">{err}</p>;
  if (!data) return <Loader label="Loading portfolio" />;

  const w = data.wallet || {};
  const rows = data.positions || [];

  return (
    <>
      <SiteNav />
      <main className="portfolio">
        <h1>Portfolio</h1>
        <p className="muted">
          Available {w.available ?? 0} · Committed {w.committed ?? 0} · Ad {w.ad_tokens ?? 0}
        </p>
        {rows.length === 0 && <p>No open positions yet. Buy YES or NO on a market.</p>}
        <div className="market-grid">
          {rows.map((p) => (
            <Link href={`/markets/${p.market_id}`} className="card" key={p.id}>
              <p className="muted">{p.market?.category} · {p.outcome?.toUpperCase()}</p>
              <h2>{p.market?.question || "Market"}</h2>
              <p>
                Shares {Number(p.shares).toFixed(2)} · avg {p.avg_price}%
              </p>
              <p className="muted">
                Spent {p.tokens_spent} · max payout {p.max_payout}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}