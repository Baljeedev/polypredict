"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "../../SiteNav";
import Loader from "../../Loader";

const API = process.env.NEXT_PUBLIC_API_URL;

function go(path) {
  window.location.assign((process.env.NEXT_PUBLIC_BASE_PATH || "") + path);
}

export default function Client({ id }) {
  const [m, setM] = useState(null);
  const [err, setErr] = useState("");
  const [tokens, setTokens] = useState(10);
  const [msg, setMsg] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

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
    fetch(`${API}/api/user`, {
      headers: { Accept: "application/json", Authorization: "Bearer " + token },
    }).then((r) => {
      if (r.ok) setLoggedIn(true);
      else localStorage.removeItem("token");
    });
  }, []);

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

  if (err) return <p className="muted market-page">Could not load market ({err})</p>;
  if (!m) return <Loader label="Loading market" />;

  return (
    <>
      <SiteNav />
      <main className="card market-page">
        <p className="muted">
          {m.category} · {m.status}
        </p>
        <h1>{m.question}</h1>
        <p>
          <span className="pct-yes">YES {m.yes_price}%</span>
          <span className="pct-no">NO {m.no_price}%</span>
        </p>
        <p className="muted">
          {m.traders_count} traders · {m.volume} tokens · source: {m.resolution_source}
        </p>
        <p>{m.resolution_rules}</p>

        {loggedIn ? (
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