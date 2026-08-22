"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "./SiteNav";
import Loader from "./Loader";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://pixxelu.com/dev/predict/backend/public";

export default function Home() {
  const [category, setCategory] = useState("");
  const [markets, setMarkets] = useState(null);
  const [msg, setMsg] = useState("Starting…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category") || "";
    setCategory(cat);

    const url = cat
      ? `${API}/api/markets?category=${encodeURIComponent(cat)}`
      : `${API}/api/markets`;

    setMsg("Fetching " + url);

    const t = setTimeout(() => {
      setMsg((m) => m + " — timeout, API jawab nahi de rahi");
      setMarkets([]);
    }, 8000);

    fetch(url)
      .then((r) => {
        setMsg("HTTP " + r.status + " from " + url);
        return r.ok ? r.json() : [];
      })
      .catch((e) => {
        setMsg("Fetch fail: " + (e.message || String(e)));
        return [];
      })
      .then((data) => {
        clearTimeout(t);
        setMarkets(Array.isArray(data) ? data : []);
      });
  }, []);

  return (
    <>
      <SiteNav />
      <p className="muted" style={{ padding: "12px 24px" }}>
        {/* {msg} */}
      </p>
      {markets === null ? (
        <Loader />
      ) : (
        <>
          <nav className="cats">
            <Link href="/" className={!category ? "cat-active" : ""}>
              Trending
            </Link>
            <Link href="/?category=Finance" className={category === "Finance" ? "cat-active" : ""}>
              Finance
            </Link>
            <Link href="/?category=Sports" className={category === "Sports" ? "cat-active" : ""}>
              Sports
            </Link>
            <Link href="/?category=Technology" className={category === "Technology" ? "cat-active" : ""}>
              Technology
            </Link>
            <Link href="/?category=Entertainment" className={category === "Entertainment" ? "cat-active" : ""}>
              Entertainment
            </Link>
            <Link href="/?category=Current affairs" className={category === "Current affairs" ? "cat-active" : ""}>
              Current affairs
            </Link>
          </nav>
          <div className="market-grid">
            {markets.length === 0 && <p>No open markets yet.</p>}
            {markets.map((m) => (
              <Link href={`/markets/${m.id}`} className="card" key={m.id}>
                <p className="live">● LIVE</p>
                <h2>{m.question}</h2>
                <p className="muted">{m.category}</p>
                <p>
                  <span className="pct-yes">YES {m.yes_price}%</span>
                  <span className="pct-no">NO {m.no_price}%</span>
                </p>
                <p className="muted">
                  {m.traders_count} traders · {m.volume} tokens
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}