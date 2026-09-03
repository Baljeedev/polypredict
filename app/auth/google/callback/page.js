"use client";

import { useEffect } from "react";

export default function GoogleCallbackPage() {
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    if (token) {
      localStorage.setItem("token", token);
      window.location.assign(base + "/");
      return;
    }
    window.location.assign(base + "/user/login/");
  }, []);

  return <p className="muted market-page">Signing in…</p>;
}