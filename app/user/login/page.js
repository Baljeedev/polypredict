"use client";

import { useState } from "react";
import Link from "next/link";
import apiBase from "../../apiBase";

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
            const API = apiBase();
            const res = await fetch(`${API}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setMessage(data.message || "Login failed. Check your email and password.");
                return;
            }
            if (!data.token) {
                setMessage("Could not reach the server. Try again.");
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

                <p className="auth-divider">Or</p>
                <a className="btn-alt btn-google" href={`${apiBase()}/api/auth/google`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </a>

                <p className="auth-divider">Not registered yet?</p>
                <Link href="/register" className="btn-alt">
                    Register
                </Link>
            </div>
        </main>
    );
}
