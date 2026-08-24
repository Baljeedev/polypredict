"use client";

import { useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

function EyeIcon({ off }) {
    if (off) {
        return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
        );
    }
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

export default function UserLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setMessage("");
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setMessage("Login failed. Check your email and password.");
                return;
            }
            localStorage.setItem("token", data.token);
            window.location.assign((process.env.NEXT_PUBLIC_BASE_PATH || "") + "/");
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
                <h1>Welcome back</h1>
                <p className="auth-sub">Sign in to continue to your account</p>

                <form onSubmit={onSubmit}>
                    <div className="auth-field">
                        <label htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="login-password">Password</label>
                        <div className="password-wrap">
                            <input
                                id="login-password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((v) => !v)}
                                onMouseDown={(e) => e.preventDefault()}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                <EyeIcon off={showPassword} />
                            </button>
                        </div>
                    </div>

                    <div className="auth-forgot-row">
                        <Link href="/forgot-password">Forgot password?</Link>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in…" : "Login"}
                    </button>
                </form>

                {message ? <p className="auth-status">{message}</p> : null}

                <p className="auth-divider">Not registered yet?</p>
                <Link href="/register" className="btn-alt">
                    Register
                </Link>
            </div>
        </main>
    );
}
