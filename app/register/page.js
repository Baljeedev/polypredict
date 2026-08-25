"use client";

import { useState } from "react";
import Link from "next/link";
import apiBase from "../apiBase";

const API = apiBase();

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

function firstError(data) {
    const first = data?.errors && Object.values(data.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
    if (typeof data?.message === "string" && data.message !== "The given data was invalid.") {
        return data.message;
    }
    return "Check your details and try again.";
}

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
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
            const res = await fetch(`${API}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ name, username, email, password }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setMessage(firstError(data));
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
                <h1>Create account</h1>
                <p className="auth-sub">Join and start trading live prediction markets</p>

                <form onSubmit={onSubmit}>
                    <div className="auth-row">
                        <div className="auth-field">
                            <label htmlFor="reg-name">Name</label>
                            <input
                                id="reg-name"
                                name="name"
                                autoComplete="name"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="auth-field">
                            <label htmlFor="reg-username">Username</label>
                            <input
                                id="reg-username"
                                name="username"
                                autoComplete="username"
                                placeholder="yourname"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                minLength={3}
                                maxLength={30}
                            />
                        </div>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="reg-email">Email</label>
                        <input
                            id="reg-email"
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
                        <label htmlFor="reg-password">Password</label>
                        <div className="password-wrap">
                            <input
                                id="reg-password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="At least 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
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

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating account…" : "Create account"}
                    </button>
                </form>

                {message ? <p className="auth-status">{message}</p> : null}

                <p className="auth-divider">Already registered?</p>
                <Link href="/user/login" className="btn-alt">
                    Login
                </Link>
            </div>
        </main>
    );
}
