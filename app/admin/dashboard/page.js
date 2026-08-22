"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AdminDashboardPage() {
    const router = useRouter();
    const [view, setView] = useState("loading");
    const [message, setMessage] = useState("");
    const [markets, setMarkets] = useState([]);
    const [users, setUsers] = useState([]);

    const [form, setForm] = useState({
        question: "",
        category: "Sports",
        closes_at: "",
        resolution_rules: "",
        resolution_source: "",
        b: "150",
        status: "open",
    });

    function token() {
        return localStorage.getItem("token");
    }

    async function loadMe() {
        const t = token();
        if (!t) {
            router.push("/admin/login");
            return;
        }
        const res = await fetch(`${API}/api/user`, {
            headers: { Accept: "application/json", Authorization: "Bearer " + t },
        });
        const user = await res.json();
        if (!res.ok || !user.is_admin) {
            localStorage.removeItem("token");
            router.push("/admin/login");
            return;
        }
        setView("dash");
        loadMarkets();
    }

    async function loadMarkets() {
        const res = await fetch(`${API}/api/admin/markets`, {
            headers: { Accept: "application/json", Authorization: "Bearer " + token() },
        });
        if (res.ok) setMarkets(await res.json());
    }

    async function loadUsers() {
        const res = await fetch(`${API}/api/admin/users`, {
            headers: { Accept: "application/json", Authorization: "Bearer " + token() },
        });
        if (res.ok) setUsers(await res.json());
    }

    useEffect(() => {
        loadMe();
    }, []);

    function setField(k, v) {
        setForm({ ...form, [k]: v });
    }

    async function onCreate(e) {
        e.preventDefault();
        const res = await fetch(`${API}/api/admin/markets`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: "Bearer " + token(),
            },
            body: JSON.stringify({
            ...form,
            closes_at: `${form.closes_date}T${form.closes_time}`,
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            setMessage(JSON.stringify(data));
            return;
        }

        setForm({
            question: "",
            category: "Sports",
            closes_at: "",
            resolution_rules: "",
            resolution_source: "",
            b: "150",
            status: "open",
        });
        setMessage("Created #" + data.id);
        setView("dash");
        loadMarkets();
    }

    function logout() {
        localStorage.removeItem("token");
        window.location.assign(
            (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/admin/login/"
        );
    }

    function Side() {
        return (
            <aside className="admin-side">
                <span className="logo">Admin</span>
                <Link href="/" className="btn-alt">View site</Link>
                <button
                    type="button"
                    className={view === "dash" ? "on" : ""}
                    onClick={() => setView("dash")}
                >
                    Markets
                </button>
                <button
                    type="button"
                    className={view === "create" ? "on" : ""}
                    onClick={() => {
                        setForm({
                            question: "",
                            category: "Sports",
                            closes_at: "",
                            resolution_rules: "",
                            resolution_source: "",
                            b: "150",
                            status: "open",
                        });
                        setView("create");
                    }}
                >
                    Add market
                </button>
                <button
                    type="button"
                    className={view === "users" ? "on" : ""}
                    onClick={() => {
                        setView("users");
                        loadUsers();
                    }}
                    >
                    Users
                </button>                
                <button type="button" className="btn-alt" onClick={logout}>
                    Logout
                </button>
            </aside>
        );
    }

    if (view === "loading") {
        return <p className="muted">Checking admin…</p>;
    }

    if (view === "create") {
        return (
            <div className="admin-shell">
                <Side />
                <main className="admin-main auth">
                    <h1>New market</h1>
                    <form onSubmit={onCreate}>
                        <p>
                            <label>
                            Question
                            <input
                                value={form.question}
                                onChange={(e) => setField("question", e.target.value)}
                                required
                            />
                            </label>
                        </p>
                        <p>
                            <label>
                            Category
                            <select
                                value={form.category}
                                onChange={(e) => setField("category", e.target.value)}
                            >
                                <option>Finance</option>
                                <option>Sports</option>
                                <option>Technology</option>
                                <option>Entertainment</option>
                                <option>Current affairs</option>
                            </select>
                            </label>
                        </p>
                        <p>
                            <label htmlFor="closes_date">Close date</label>
                            <input
                                id="closes_date"
                                type="date"
                                value={form.closes_date}
                                onChange={(e) => setField("closes_date", e.target.value)}
                                required
                            />
                        </p>
                        <p>
                            <label htmlFor="closes_time">Close time</label>
                            <input
                                id="closes_time"
                                type="time"
                                step="60"
                                value={form.closes_time}
                                onChange={(e) => setField("closes_time", e.target.value)}
                                required
                            />
                        </p>
                        <p>
                            <label>
                            Resolution rules
                            <input
                                value={form.resolution_rules}
                                onChange={(e) => setField("resolution_rules", e.target.value)}
                                required
                            />
                            </label>
                        </p>
                        <p>
                            <label>
                            Resolution source
                            <input
                                value={form.resolution_source}
                                onChange={(e) => setField("resolution_source", e.target.value)}
                                required
                            />
                            </label>
                        </p>
                        <p>
                            <label>
                            Liquidity (b)
                            <select value={form.b} onChange={(e) => setField("b", e.target.value)}>
                                <option value="100">100 (fast)</option>
                                <option value="150">150 (normal)</option>
                                <option value="500">500 (slow)</option>
                            </select>
                            </label>
                        </p>
                        <p>
                            <label>
                            Status
                            <select
                                value={form.status}
                                onChange={(e) => setField("status", e.target.value)}
                            >
                                <option value="draft">draft</option>
                                <option value="open">open</option>
                            </select>
                            </label>
                        </p>
                        <button type="submit">Create</button>
                    </form>
                    <p>{message}</p>
                </main>
            </div>
        );
    }

    if (view === "users") {
        return (
        <div className="admin-shell">
            <Side />
            <main className="admin-main admin-dash">
            <h1>Registered users</h1>
            <table className="admin-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Tokens</th>
                    <th>Admin</th>
                </tr>
                </thead>
                <tbody>
                {users.map((u) => (
                    <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username || u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.wallet?.available ?? 0}</td>
                    <td>{u.is_admin ? "yes" : "no"}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </main>
        </div>
        );
    }

    return (
        <div className="admin-shell">
            <Side />
            <main className="admin-main admin-dash">
                <h1>Dashboard</h1>
                <p>{message}</p>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Question</th>
                            <th>Category</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {markets.map((m) => (
                            <tr key={m.id}>
                                <td>{m.id}</td>
                                <td>{m.question}</td>
                                <td>{m.category}</td>
                                <td>{m.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
        </div>
    );
}