"use client";

import { useEffect, useState } from "react";
import apiBase from "./apiBase";

const LATER_KEY = "claim_later_date";

function claimedToday(wallet) {
  const t = wallet?.last_claim_at;
  if (!t) return false;
  return new Date(t).toDateString() === new Date().toDateString();
}

function saidLaterToday() {
  try {
    return sessionStorage.getItem(LATER_KEY) === new Date().toDateString();
  } catch {
    return false;
  }
}

export default function ClaimPopup() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || saidLaterToday()) return;

    fetch(`${apiBase()}/api/wallet`, {
      headers: { Accept: "application/json", Authorization: "Bearer " + token },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((w) => {
        if (w && !claimedToday(w)) setOpen(true);
      })
      .catch(() => {});
  }, []);

  function later() {
    try {
      sessionStorage.setItem(LATER_KEY, new Date().toDateString());
    } catch {}
    setOpen(false);
  }

  async function claim() {
    const token = localStorage.getItem("token");
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`${apiBase()}/api/wallet/claim`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: "Bearer " + token },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(body.message || "Could not claim");
        return;
      }
      setMsg("You got 50 tokens.");
      setTimeout(() => setOpen(false), 1200);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="claim-bg">
      <div className="claim-box" onClick={(e) => e.stopPropagation()}>
        <div className="claim-orb" aria-hidden="true">
          <span>50</span>
        </div>
        <p className="home-kicker">Daily reward is ready</p>
        <h3>Grab your +50 tokens</h3>
        <p className="muted">One tap. Once a day. Virtual tokens only.</p>
        <button type="button" className="btn-claim" disabled={busy} onClick={claim}>
          {busy ? "Claiming…" : msg ? "Claimed" : "Claim now"}
        </button>
        {msg ? <p className="claim-ok">{msg}</p> : null}
        <button type="button" className="claim-later" onClick={later}>
          Maybe later
        </button>
      </div>
    </div>
  );
}