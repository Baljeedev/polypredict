"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteNav from "../../SiteNav";
import Loader from "../../Loader";
import apiBase from "../../apiBase";

const API = apiBase();
const RANGES = [
  { id: "1H", hours: 1 },
  { id: "1D", hours: 24 },
  { id: "1W", hours: 24 * 7 },
  { id: "1M", hours: 24 * 30 },
  { id: "MAX", hours: 0 },
];

function go(path) {
  window.location.assign((process.env.NEXT_PUBLIC_BASE_PATH || "") + path);
}

function formatCount(n) {
  return Number(n || 0).toLocaleString();
}

function formatMoney(n) {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function syntheticHistory(market) {
  const end = Math.max(5, Math.min(95, Number(market.yes_price) || 50));
  const id = Number(market.id) || 1;
  const start = Math.max(8, Math.min(92, end + ((id * 7) % 21) - 10));
  const now = Date.now();
  const n = 36;
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 1 : i / (n - 1);
    const wave = Math.sin((i + (id % 7)) * 0.55) * 5;
    let yes = Math.round(start + (end - start) * t + wave);
    yes = Math.max(5, Math.min(95, yes));
    if (i === n - 1) yes = end;
    return {
      yes_price: yes,
      no_price: 100 - yes,
      volume: Math.round(Number(market.volume || 0) * t),
      created_at: new Date(now - (30 - 30 * t) * 24 * 3600 * 1000).toISOString(),
    };
  });
}

function PriceChart({ points }) {
  const w = 720;
  const h = 240;
  const pad = { l: 8, r: 44, t: 16, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const rows = points.length ? points : [{ yes_price: 50, no_price: 50, created_at: new Date().toISOString() }];
  const xs = rows.map((_, i) => pad.l + (rows.length === 1 ? innerW / 2 : (i / (rows.length - 1)) * innerW));
  const y = (v) => pad.t + innerH - (Number(v) / 100) * innerH;
  const yesPts = rows.map((p, i) => `${xs[i]},${y(p.yes_price)}`).join(" ");
  const noPts = rows.map((p, i) => `${xs[i]},${y(p.no_price)}`).join(" ");
  const last = rows[rows.length - 1];
  const firstDate = new Date(rows[0].created_at);
  const lastDate = new Date(rows[rows.length - 1].created_at);
  const ticks = [0, 25, 50, 75, 100];

  return (
    <svg className="mkt-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Price history">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" />
          <text x={w - pad.r + 6} y={y(t) + 4} fill="#6b7280" fontSize="11">
            {t}%
          </text>
        </g>
      ))}
      <polyline points={noPts} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
      <polyline points={yesPts} fill="none" stroke="#00e57b" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={y(last.yes_price)} r="4" fill="#00e57b" />
      <text x={pad.l} y={h - 6} fill="#6b7280" fontSize="11">
        {firstDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </text>
      <text x={w - pad.r} y={h - 6} fill="#6b7280" fontSize="11" textAnchor="end">
        {lastDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </text>
    </svg>
  );
}

export default function Client({ id }) {
  const [m, setM] = useState(null);
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState("");
  const [tokens, setTokens] = useState(10);
  const [side, setSide] = useState("yes");
  const [range, setRange] = useState("MAX");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [posYes, setPosYes] = useState(null);
  const [posNo, setPosNo] = useState(null);
  const [preview, setPreview] = useState(null);


  function applyMarket(data) {
    setM(data);
    const ticks = Array.isArray(data.history) && data.history.length ? data.history : syntheticHistory(data);
    setHistory(ticks);
  }

  useEffect(() => {
    fetch(`${API}/api/markets/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(applyMarket)
      .catch((e) => setErr(e.message || "Failed"));
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const headers = {
      Accept: "application/json",
      Authorization: "Bearer " + token,
    };

    fetch(`${API}/api/user`, { headers }).then((r) => {
      if (r.ok) setLoggedIn(true);
      else localStorage.removeItem("token");
    });

    fetch(`${API}/api/wallet`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((w) => w && setWallet(w));

    fetch(`${API}/api/portfolio`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.positions) return;
        const rows = data.positions.filter((p) => String(p.market_id) === String(id));
        setPosYes(rows.find((p) => p.outcome === "yes") || null);
        setPosNo(rows.find((p) => p.outcome === "no") || null);
      });
  }, [id]);

  const chartPoints = useMemo(() => {
    const spec = RANGES.find((r) => r.id === range) || RANGES[4];
    if (!spec.hours) return history;
    const cutoff = Date.now() - spec.hours * 3600 * 1000;
    const filtered = history.filter((p) => new Date(p.created_at).getTime() >= cutoff);
    return filtered.length ? filtered : history.slice(-8);
  }, [history, range]);

  const price = side === "yes" ? Number(m?.yes_price) || 0 : Number(m?.no_price) || 0;
  const amount = Math.max(0, Number(tokens) || 0);
  const toWin = amount > 0 && price > 0 ? (amount * 100) / price : 0;

  function needLogin() {
    window.alert("Please login to trade");
    go("/user/login/");
  }

  async function openPreview() {
    setMsg("");
    if (!loggedIn) {
      needLogin();
      return;
    }
    if (amount < 1) {
      setMsg("Enter an amount to buy.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/markets/${id}/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ outcome: side, tokens: amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.message || "Could not preview trade.");
        return;
      }
      setPreview(data);
    } finally {
      setBusy(false);
    }
  }

  async function buy() {
    setMsg("");
    const token = localStorage.getItem("token");
    if (!token) {
      needLogin();
      return;
    }
    if (amount < 1) {
      setMsg("Enter an amount to buy.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/markets/${id}/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ outcome: side, tokens: amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        localStorage.removeItem("token");
        needLogin();
        return;
      }
      if (!res.ok) {
        const first = data.errors && Object.values(data.errors)[0];
        setMsg((Array.isArray(first) && first[0]) || data.message || "Trade failed.");
        return;
      }
      if (data.market) {
        applyMarket({
          ...data.market,
          history: [
            ...history,
            {
              yes_price: data.market.yes_price,
              no_price: data.market.no_price,
              volume: data.market.volume,
              created_at: new Date().toISOString(),
            },
          ],
        });
      }
      if (data.wallet) setWallet(data.wallet);
      if (data.position?.outcome === "yes") setPosYes(data.position);
      if (data.position?.outcome === "no") setPosNo(data.position);
      setMsg("Trade placed.");
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  async function sell(outcome) {
    setMsg("");
    const token = localStorage.getItem("token");
    if (!token) {
      needLogin();
      return;
    }
    const pos = outcome === "yes" ? posYes : posNo;
    if (!pos || Number(pos.shares) <= 0) {
      setMsg("No shares to sell on this side.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/markets/${id}/sell`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ outcome, shares: Number(pos.shares) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        localStorage.removeItem("token");
        needLogin();
        return;
      }
      if (!res.ok) {
        setMsg(data.message || "Sell failed.");
        return;
      }
      if (data.market) applyMarket({ ...data.market, history });
      if (data.wallet) setWallet(data.wallet);
      if (outcome === "yes") setPosYes(null);
      else setPosNo(null);
      setMsg(`Sold for ${formatCount(data.sold_tokens)} tokens.`);
    } finally {
      setBusy(false);
    }
  }

  function addChip(n) {
    setTokens((v) => Math.max(0, Number(v) || 0) + n);
  }

  if (err) return <p className="muted market-page">Could not load market ({err})</p>;
  if (!m) return <Loader label="Loading market" />;

  return (
    <>
      <SiteNav />
      <main className="market-page mkt">
        <div className="mkt-main">
          <p className="home-kicker">{m.category}</p>
          <h1>{m.question}</h1>
          <p className="muted">
            {m.status === "open" ? "LIVE" : m.status}
            {" · "}
            {formatCount(m.traders_count)} traders · {formatCount(m.volume)} vol
          </p>

          <div className="mkt-chart-card">
            <div className="mkt-legend">
              <span className="yes">YES {m.yes_price}%</span>
              <span className="no">NO {m.no_price}%</span>
            </div>
            <PriceChart points={chartPoints} />
            <div className="mkt-chart-foot">
              <small>{formatCount(m.volume)} vol</small>
              <div className="mkt-ranges">
                {RANGES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={range === r.id ? "on" : ""}
                    onClick={() => setRange(r.id)}
                  >
                    {r.id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mkt-outcome">
            <div>
              <b>YES / NO</b>
              <small>{formatCount(m.volume)} vol · crowd {m.yes_price}%</small>
            </div>
            <div className="mkt-buy-row">
              <button type="button" className="mkt-buy-yes" onClick={() => setSide("yes")}>
                Buy Yes {m.yes_price} tokens
              </button>
              <button type="button" className="mkt-buy-no" onClick={() => setSide("no")}>
                Buy No {m.no_price} tokens
              </button>
            </div>
          </div>

          <p className="muted">Source: {m.resolution_source}</p>
          <p>{m.resolution_rules}</p>
        </div>

        <aside className="mkt-sheet">
          {m.status === "resolved" ? (
            <div className="trade">
              <p className={m.winner === "yes" ? "pct-yes" : "pct-no"}>
                Result: {(m.winner || "").toUpperCase()} won
              </p>
              <p className="muted">This market is settled. Trading is closed.</p>
              <Link href="/" className="btn-alt">
                Back to markets
              </Link>
            </div>
          ) : (
            <>
              <div className="mkt-sheet-top">
                <span>Buy</span>
                {wallet ? <small>{formatCount(wallet.available)} available</small> : <small>Logged-in guests can trade</small>}
              </div>
              <p className="mkt-sheet-q">
                {m.question}
                <em>
                  {" "}
                  · <b className={side}>{side === "yes" ? "Yes" : "No"}</b>
                </em>
              </p>

              <label className="mkt-amount">
                <span>Amount</span>
                <input
                  type="number"
                  min="0"
                  value={tokens}
                  onChange={(e) => setTokens(e.target.value)}
                />
              </label>

              <div className="mkt-toggle" role="tablist">
                <button type="button" className={side === "yes" ? "on yes" : ""} onClick={() => setSide("yes")}>
                  Yes
                </button>
                <button type="button" className={side === "no" ? "on no" : ""} onClick={() => setSide("no")}>
                  No
                </button>
              </div>

              <div className="mkt-chips">
                {[1, 5, 10, 100].map((n) => (
                  <button key={n} type="button" onClick={() => addChip(n)}>
                    +{n}
                  </button>
                ))}
              </div>

              <div className="mkt-win">
                <p>
                  To win <b>{formatMoney(toWin)}</b>
                </p>
                <small>
                  Est. return if {side.toUpperCase()} wins · {price} tokens
                </small>
              </div>

              <button
                type="button"
                className={`mkt-trade ${side}`}
                disabled={busy || m.status !== "open"}
                onClick={loggedIn ? openPreview : needLogin}
              >
                {busy ? "Trading…" : loggedIn ? "Trade" : "Log in to trade"}
              </button>

              {(posYes || posNo) && (
                <div className="trade-sell">
                  {posYes && (
                    <p className="muted">Your YES: {Number(posYes.shares).toFixed(2)} shares</p>
                  )}
                  {posNo && (
                    <p className="muted">Your NO: {Number(posNo.shares).toFixed(2)} shares</p>
                  )}
                  <div className="trade-btns">
                    {posYes && (
                      <button type="button" className="btn-alt" onClick={() => sell("yes")}>
                        Sell YES
                      </button>
                    )}
                    {posNo && (
                      <button type="button" className="btn-alt" onClick={() => sell("no")}>
                        Sell NO
                      </button>
                    )}
                  </div>
                </div>
              )}

              {msg ? <p className="mkt-msg">{msg}</p> : null}
            </>
          )}
        </aside>
      </main>


      {preview && (
        <div className="mkt-modal-bg" onClick={() => setPreview(null)}>
          <div className="mkt-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm trade</h3>
            <p className="muted">
              Buy {side.toUpperCase()} · {amount} tokens
            </p>
            <ul className="mkt-modal-list">
              <li>Shares <b>{preview.shares}</b></li>
              <li>Avg price <b>{preview.avg_price} tokens</b></li>
              <li>If you win <b>{preview.max_payout} tokens</b></li>
              <li>Profit <b>{preview.profit} tokens</b></li>
              <li>If you lose <b>{preview.loss} tokens</b></li>
              <li>
                New price <b>YES {preview.new_yes_price}%</b> · <b>NO {preview.new_no_price}%</b>
              </li>
            </ul>
            <div className="mkt-modal-btns">
              <button type="button" className="btn-alt" onClick={() => setPreview(null)}>
                Cancel
              </button>
              <button type="button" className={`mkt-trade ${side}`} disabled={busy} onClick={buy}>
                {busy ? "Trading…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}
