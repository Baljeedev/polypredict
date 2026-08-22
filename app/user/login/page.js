"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function UserLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    async function onSubmit(e) {
        e.preventDefault();
        setMessage("...");
        const res = await fetch(`${API}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
            setMessage("Login failed");
            return;
        }
        localStorage.setItem("token", data.token);
        window.location.assign((process.env.NEXT_PUBLIC_BASE_PATH || "") + "/");
    }

    return (
        <main className="auth">
            <h1>User login</h1>
            <form onSubmit={onSubmit}>
                <p>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </p>
                <p>
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </p>
                <button type="submit">Login</button>
            </form>
            <p>{message}</p>
            <p className="auth-hint">Not registered yet?</p>
            <p>
                <Link href="/register" className="btn-alt">
                    Register
                </Link>
            </p>
        </main>
    );
}