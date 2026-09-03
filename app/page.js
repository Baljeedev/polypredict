"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteNav from "./SiteNav";
import Loader from "./Loader";
import apiBase from "./apiBase";


const API = apiBase();
const CATEGORIES = [
  { href: "/", label: "Trending", value: "" },
  { href: "/?category=Finance", label: "Finance", value: "Finance" },
  { href: "/?category=Sports", label: "Sports", value: "Sports" },
  { href: "/?category=Technology", label: "Technology", value: "Technology" },
  { href: "/?category=Entertainment", label: "Entertainment", value: "Entertainment" },
  { href: "/?category=Current affairs", label: "Current affairs", value: "Current affairs" },
];

function formatCount(n) {
  const num = Number(n) || 0;
  return num.toLocaleString();
}

function HomeMarkets() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
  const [markets, setMarkets] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setMarkets([]), 8000);

    fetch(`${API}/api/markets`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data) => {
        clearTimeout(t);
        setMarkets(Array.isArray(data) ? data : []);
      });

    return () => clearTimeout(t);
  }, []);

  const featured =
    markets && markets.length
      ? [...markets].sort((a, b) => (Number(b.volume) || 0) - (Number(a.volume) || 0))[0]
      : null;

  const visible =
    markets && category
      ? markets.filter((m) => m.category === category)
      : markets;

  return (
    <div className="home-shell">
      <div className="home-grid" aria-hidden="true" />
      <div className="home-content">
        <section className="home-hero">
          <div className="hero-bg" aria-hidden="true">
            <span className="hero-orb hero-orb-a" />
            <span className="hero-orb hero-orb-b" />
            <span className="hero-orb hero-orb-c" />
            <span className="hero-scan" />
          </div>
          <div className="hero-copy">
            <p className="home-kicker">Live prediction markets.</p>
            <h1>
              See the odds.
              <span> Make the call.</span>
            </h1>
            <p>Trade YES or NO on live events. Prices move with the crowd — get in before the story ends.</p>
            {markets && markets.length > 0 && (
              <div className="home-stats">
                <span>
                  <b>{markets.length}</b> live
                </span>
                <span>
                  <b>
                    {formatCount(
                      markets.reduce((sum, m) => sum + (Number(m.traders_count) || 0), 0)
                    )}
                  </b>{" "}
                  traders
                </span>
                <span>
                  <b>
                    {formatCount(
                      markets.reduce((sum, m) => sum + (Number(m.volume) || 0), 0)
                    )}
                  </b>{" "}
                  volume
                </span>
              </div>
            )}
          </div>

          <aside className="hero-board">
            {featured ? (
              <Link href={`/markets/${featured.id}`} className="hero-featured">
                <div className="hero-featured-top">
                  <span className="hot-badge">Hottest</span>
                  <span className="card-cat">{featured.category}</span>
                  <p className="live">LIVE</p>
                </div>
                <div className="hero-featured-body">
                  <div
                    className="hero-ring"
                    style={{ "--p": `${featured.yes_price}%` }}
                    aria-hidden="true"
                  >
                    <div className="hero-ring-inner">
                      <b>{featured.yes_price}%</b>
                      <small>YES</small>
                    </div>
                  </div>
                  <div className="hero-featured-main">
                    <h2>{featured.question}</h2>
                    <div className="odds-track">
                      <span className="odds-fill-yes" style={{ width: `${featured.yes_price}%` }} />
                    </div>
                    <div className="odds-row">
                      <span className="pct-yes">
                        <span className="pct-k">YES</span>
                        <span className="pct-n">{featured.yes_price}%</span>
                      </span>
                      <span className="pct-no">
                        <span className="pct-k">NO</span>
                        <span className="pct-n">{featured.no_price}%</span>
                      </span>
                    </div>
                    <div className="hero-featured-foot">
                      <span>
                        {formatCount(featured.traders_count)} traders · {formatCount(featured.volume)} vol
                      </span>
                      <span className="hero-cta">Trade now</span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="hero-featured hero-featured-wait">
                <div className="hero-featured-top">
                  <span className="hot-badge">Hottest</span>
                  <p className="live">LIVE</p>
                </div>
                <h2>Waiting for live markets…</h2>
              </div>
            )}
          </aside>
        </section>

        <nav className="cats">
          {CATEGORIES.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              scroll={false}
              className={category === c.value ? "cat-active" : ""}
            >
              {c.label}
            </Link>
          ))}
        </nav>
        {visible === null ? (
          <Loader />
        ) : (
            <div className="market-grid">
              {visible.length === 0 && <p>No open markets yet.</p>}
              {visible.map((m, i) => (
                <Link
                  href={`/markets/${m.id}`}
                  className="card"
                  key={m.id}
                  style={{ "--i": i }}
                >
                  <div className="card-head">
                    <p className="live">LIVE</p>
                    <span className="card-cat">{m.category}</span>
                  </div>
                  <h2>{m.question}</h2>
                  <div className="odds-track" aria-hidden="true">
                    <span className="odds-fill-yes" style={{ width: `${m.yes_price}%` }} />
                  </div>
                  <div className="odds-row">
                    <span className="pct-yes">
                      <span className="pct-k">YES</span>
                      <span className="pct-n">{m.yes_price}%</span>
                    </span>
                    <span className="pct-no">
                      <span className="pct-k">NO</span>
                      <span className="pct-n">{m.no_price}%</span>
                    </span>
                  </div>
                  <div className="card-stats">
                    <span>{formatCount(m.traders_count)} traders</span>
                    <span>{formatCount(m.volume)} vol</span>
                  </div>
                </Link>
              ))}
            </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SiteNav />      
      <Suspense fallback={<Loader />}>
        <HomeMarkets />
      </Suspense>
    </>
  );
}
