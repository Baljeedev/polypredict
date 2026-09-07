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

function formatScore(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  return num % 1 === 0 ? String(num) : num.toFixed(1);
}

function ExpertPulse({ topic }) {
  const [rows, setRows] = useState(null);
  const [me, setMe] = useState("");

  useEffect(() => {
    setRows(null);
    const url = topic
      ? `${API}/api/leaderboard/experts?category=${encodeURIComponent(topic)}&limit=200`
      : `${API}/api/leaderboard/experts?limit=200`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  }, [topic]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/api/user`, {
      headers: { Accept: "application/json", Authorization: "Bearer " + token },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (u?.username || u?.name) setMe(u.username || u.name);
      })
      .catch(() => {});
  }, []);

  if (!rows || rows.length === 0) return null;

  const label = topic || "these markets";
  const top = rows.slice(0, 2);
  const mine = me
    ? rows.find((r) => String(r.username).toLowerCase() === String(me).toLowerCase())
    : null;

  return (
    <section className="home-pulse">
      <div className="home-pulse-head">
        <div>
          <p className="home-kicker">{topic ? `${topic} experts` : "Top experts"}</p>
          <h2>Who actually knows {label}?</h2>
        </div>
        <Link href="/leaderboard" className="home-pulse-link">
          Full board →
        </Link>
      </div>
      <ol className="home-pulse-list">
        {top.map((r) => (
          <li key={r.username}>
            <span className="home-pulse-rank">#{r.rank}</span>
            <Link href={`/traders?u=${encodeURIComponent(r.username)}`}>
              @{r.username}
            </Link>
            <span className="home-pulse-score">
              {r.rank === 1 ? "Expert Score " : ""}
              {formatScore(r.score ?? r.tokens)}
            </span>
          </li>
        ))}
      </ol>
      <p className="home-pulse-you">
        {mine
          ? `Your rank: #${mine.rank}`
          : me
            ? `Your rank: settle a ${topic || "live"} market to appear here.`
            : "Log in to see your rank."}
      </p>
    </section>
  );
}

function MarketCard({ m, i = 0 }) {
  return (
    <Link href={`/markets/${m.id}`} className="card" style={{ "--i": i }}>
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
  );
}

function SideList({ title, items }) {
  if (!items.length) return null;
  return (
    <section className="home-side-box">
      <h3>{title}</h3>
      <ul>
        {items.map((m) => (
          <li key={title + m.id}>
            <Link href={`/markets/${m.id}`}>
              <b>{m.question}</b>
              <span>{m.yes_price}%</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
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

  const catBlocks = CATEGORIES.filter((c) => c.value).map((c) => ({
    ...c,
    items: (markets || []).filter((m) => m.category === c.value),
  })).filter((c) => c.items.length > 0);

  const trending = [...(markets || [])]
    .sort((a, b) => (Number(b.traders_count) || 0) - (Number(a.traders_count) || 0))
    .slice(0, 5);
  const movers = [...(markets || [])]
    .sort((a, b) => Math.abs((Number(b.yes_price) || 50) - 50) - Math.abs((Number(a.yes_price) || 50) - 50))
    .slice(0, 5);
  const newest = [...(markets || [])].sort((a, b) => b.id - a.id).slice(0, 5);
  const hottest = [...(markets || [])]
    .sort((a, b) => (Number(b.volume) || 0) - (Number(a.volume) || 0))
    .slice(0, 5);

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

        <ExpertPulse topic={category} />

        {markets === null ? (
          <Loader />
        ) : (
          <div className="home-deck">
            <div className="home-deck-main">
              {category ? (
                <section className="home-cat-block">
                  <div className="home-cat-head">
                    <h2>{category}</h2>
                  </div>
                  {visible.length === 0 ? (
                    <p className="muted">No open markets in {category} yet.</p>
                  ) : (
                    <div className="market-grid home-cat-grid">
                      {visible.map((m, i) => (
                        <MarketCard key={m.id} m={m} i={i} />
                      ))}
                    </div>
                  )}
                </section>
              ) : catBlocks.length === 0 ? (
                <p className="muted" style={{ padding: "0 0 24px" }}>
                  No open markets yet.
                </p>
              ) : (
                catBlocks.map((block) => (
                  <section key={block.value} className="home-cat-block">
                    <div className="home-cat-head">
                      <h2>
                        <Link href={block.href}>{block.label}</Link>
                      </h2>
                      {block.items.length > 4 ? (
                        <Link href={block.href} className="home-cat-all">
                          See all
                        </Link>
                      ) : null}
                    </div>
                    <div className="market-grid home-cat-grid">
                      {block.items.slice(0, 4).map((m, i) => (
                        <MarketCard key={m.id} m={m} i={i} />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
            <aside className="home-side">
              <SideList title="Trending" items={trending} />
              <SideList title="Top movers" items={movers} />
              <SideList title="New" items={newest} />
              <SideList title="Highest volume" items={hottest} />
            </aside>
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
