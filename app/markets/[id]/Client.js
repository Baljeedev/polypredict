"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "../../SiteNav";
import Loader from "../../Loader";
import apiBase from "../../apiBase";

const API = apiBase();

function go(path) {
  window.location.assign((process.env.NEXT_PUBLIC_BASE_PATH || "") + path);
}

export default function Client({ id }) {
  const [m, setM] = useState(null);
  const [err, setErr] = useState("");
  const [tokens, setTokens] = useState(10);
  const [msg, setMsg] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [posYes, setPosYes] = useState(null);
  const [posNo, setPosNo] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/markets/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(setM)
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

    fetch(`${API}/api/portfolio`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.positions) return;
        const rows = data.positions.filter(
          (p) => String(p.market_id) === String(id)
        );
        setPosYes(rows.find((p) => p.outcome === "yes") || null);
        setPosNo(rows.find((p) => p.outcome === "no") || null);
      });
  }, [id]);

  async function buy(outcome) {
    setMsg("");
    const token = localStorage.getItem("token");
    if (!token) {
      window.alert("Please login to trade");
      go("/user/login/");
      return;
    }

    const res = await fetch(`${API}/api/markets/${id}/buy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ outcome, tokens: Number(tokens) }),
    });

    const data = await res.json();

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.alert("Please login to trade");
      go("/user/login/");
      return;
    }

    if (!res.ok) {
      setMsg(JSON.stringify(data.errors || data.message || data));
      return;
    }

    go("/");
  }

  async function sell(outcome) {
    setMsg("");
    const token = localStorage.getItem("token");
    if (!token) {
      window.alert("Please login to trade");
      go("/user/login/");
      return;
    }

    const pos = outcome === "yes" ? posYes : posNo;
    if (!pos || Number(pos.shares) <= 0) {
      setMsg("No shares to sell on this side.");
      return;
    }

    const res = await fetch(`${API}/api/markets/${id}/sell`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        outcome,
        shares: Number(pos.shares),
      }),
    });

    const data = await res.json();

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.alert("Please login to trade");
      go("/user/login/");
      return;
    }

    if (!res.ok) {
      setMsg(JSON.stringify(data.errors || data.message || data));
      return;
    }

    go("/");
  }

  if (err) return <p className="muted market-page">Could not load market ({err})</p>;
  if (!m) return <Loader label="Loading market" />;

  return (
    <>
      <SiteNav />
      <main className="market-page">
        <p className="home-kicker">{m.category}</p>
        <h1>{m.question}</h1>
        <p className="muted">
          {m.status === "open" ? "LIVE" : m.status}
          {" · "}
          {m.traders_count} traders · {m.volume} vol
        </p>

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

        <p className="muted">Source: {m.resolution_source}</p>
        <p>{m.resolution_rules}</p>

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
        ) : loggedIn ? (
          <div className="trade">
            <label>
              Tokens
              <input
                type="number"
                min="1"
                value={tokens}
                onChange={(e) => setTokens(e.target.value)}
              />
            </label>
            <div className="trade-btns">
              <button type="button" className="btn-yes" onClick={() => buy("yes")}>
                Buy YES
              </button>
              <button type="button" className="btn-no" onClick={() => buy("no")}>
                Buy NO
              </button>
            </div>

            {(posYes || posNo) && (
              <div className="trade-sell">
                {posYes && (
                  <p className="muted">
                    Your YES: {Number(posYes.shares).toFixed(2)} shares
                  </p>
                )}
                {posNo && (
                  <p className="muted">
                    Your NO: {Number(posNo.shares).toFixed(2)} shares
                  </p>
                )}
                <div className="trade-btns">
                  {posYes && (
                    <button
                      type="button"
                      className="btn-alt"
                      onClick={() => sell("yes")}
                    >
                      Sell YES
                    </button>
                  )}
                  {posNo && (
                    <button
                      type="button"
                      className="btn-alt"
                      onClick={() => sell("no")}
                    >
                      Sell NO
                    </button>
                  )}
                </div>
              </div>
            )}

            {msg && <p className="muted">{msg}</p>}
          </div>
        ) : (
          <p className="muted">
            <Link href="/user/login" className="btn-alt">
              Login
            </Link>{" "}
            to trade
          </p>
        )}
      </main>
    </>
  );
}