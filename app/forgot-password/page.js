"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ForgotPasswordForm() {
    const searchParams = useSearchParams();
    const fromAdmin = searchParams.get("from") === "admin";
    const loginHref = fromAdmin ? "/admin/login" : "/user/login";
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        await new Promise((r) => setTimeout(r, 600));
        setSent(true);
        setLoading(false);
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
                <h1>Forgot password</h1>
                <p className="auth-sub">
                    {sent
                        ? "Check your inbox for the next step."
                        : "Enter your email and we’ll send reset instructions."}
                </p>

                {sent ? (
                    <div className="auth-success">
                        <p>
                            If an account exists for <strong>{email}</strong>, you’ll receive a
                            reset link shortly.
                        </p>
                        <Link href={loginHref} className="btn-alt">
                            Back to login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={onSubmit}>
                        <div className="auth-field">
                            <label htmlFor="reset-email">Email</label>
                            <input
                                id="reset-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading}>
                            {loading ? "Sending…" : "Send reset link"}
                        </button>
                    </form>
                )}

                {!sent ? (
                    <p className="auth-hint">
                        <Link href={loginHref}>Back to login</Link>
                    </p>
                ) : null}
            </div>
        </main>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<main className="auth auth-screen" />}>
            <ForgotPasswordForm />
        </Suspense>
    );
}
