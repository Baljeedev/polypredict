"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import apiBase from "../apiBase";

const API = apiBase();

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const emailFromLink = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailFromLink);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.message || "This reset link is invalid or expired.");
        return;
      }
      setOk(true);
    } catch {
      setMessage("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth auth-screen">
      <div className="auth-bg" aria-hidden="true">
        <span className="auth-orb auth-orb-a" />
        <span className="auth-orb auth-orb-b" />
        <span className="auth-orb auth-orb-c" />
      </div>
      <div className="auth-card">
        <Link href="/" className="auth-logo">
          Polypredict
        </Link>
        <h1>New password</h1>
        <p className="auth-sub">Choose a password with at least 8 characters.</p>
        {message ? <p className="auth-error">{message}</p> : null}
        {ok ? (
          <div className="auth-success">
            <p>Password updated.</p>
            <Link href="/user/login" className="btn-alt">
              Log in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="auth-field">
              <label htmlFor="rp-email">Email</label>
              <input
                id="rp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="rp-pass">New password</label>
              <input
                id="rp-pass"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="rp-pass2">Confirm password</label>
              <input
                id="rp-pass2"
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <button type="submit" disabled={loading || !token}>
              {loading ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="auth auth-screen" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}