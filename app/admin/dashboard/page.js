"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "../../Loader";
import apiBase from "../../apiBase";

const API = apiBase();

const EMPTY_FORM = {
    question: "",
    category: "Sports",
    closes_date: "",
    closes_time: "",
    resolution_rules: "",
    resolution_source: "",
    b: "150",
    status: "open",
};

function formatCount(n) {
    return Number(n || 0).toLocaleString();
}

function initials(name) {
    const parts = String(name || "")
        .trim()
        .split(/[\s._@-]+/)
        .filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return String(name || "A").slice(0, 2).toUpperCase();
}

function NavIcon({ children }) {
    return (
        <span className="adash-ico" aria-hidden="true">
            {children}
        </span>
    );
}

function VolumeChart({ values }) {
    const w = 640;
    const h = 220;
    const pad = 18;
    const nums = values.length ? values : [12, 18, 16, 28, 24, 36, 32, 44];
    const max = Math.max(...nums, 1);
    const step = (w - pad * 2) / Math.max(nums.length - 1, 1);
    const pts = nums.map((v, i) => {
        const x = pad + i * step;
        const y = h - pad - (v / max) * (h - pad * 2);
        return `${x},${y}`;
    });
    const last = nums[nums.length - 1];
    const lastX = pad + (nums.length - 1) * step;
    const lastY = h - pad - (last / max) * (h - pad * 2);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];

    return (
        <svg className="adash-chart" viewBox={`0 0 ${w} ${h + 28}`} role="img" aria-label="Volume over time">
            <defs>
                <linearGradient id="adashFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e57b" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#00e57b" stopOpacity="0" />
                </linearGradient>
            </defs>
            <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} stroke="rgba(255,255,255,0.06)" />
            <polygon
                points={`${pad},${h - pad} ${pts.join(" ")} ${w - pad},${h - pad}`}
                fill="url(#adashFill)"
            />
            <polyline
                points={pts.join(" ")}
                fill="none"
                stroke="#00e57b"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            <polyline
                points={pts.map((p) => {
                    const [x, y] = p.split(",");
                    return `${x},${Number(y) + 14}`;
                }).join(" ")}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <line x1={lastX} y1={pad} x2={lastX} y2={h - pad} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 6" />
            <circle cx={lastX} cy={lastY} r="5" fill="#00e57b" />
            {months.slice(0, nums.length).map((m, i) => (
                <text key={m} x={pad + i * step} y={h + 20} textAnchor="middle" fill="#6b7280" fontSize="11">
                    {m}
                </text>
            ))}
        </svg>
    );
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [view, setView] = useState("loading");
    const [message, setMessage] = useState("");
    const [markets, setMarkets] = useState([]);
    const [users, setUsers] = useState([]);
    const [adminUser, setAdminUser] = useState(null);
    const [query, setQuery] = useState("");
    const [form, setForm] = useState(EMPTY_FORM);
    const [menu, setMenu] = useState(null);
    const [notesRead, setNotesRead] = useState(false);
    const topRightRef = useRef(null);

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
        setAdminUser(user);
        setView("overview");
        loadMarkets();
        loadUsers();
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
            setMessage(data.message || JSON.stringify(data));
            return;
        }
        setForm(EMPTY_FORM);
        setMessage("Market #" + data.id + " created");
        setView("markets");
        loadMarkets();
    }

    async function resolveMarket(id, outcome) {
        const label = outcome === "yes" ? "YES" : "NO";
        if (!window.confirm("Declare " + label + " the winner for market #" + id + "?")) {
            return;
        }
        const res = await fetch(`${API}/api/admin/markets/${id}/resolve`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: "Bearer " + token(),
            },
            body: JSON.stringify({ outcome }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setMessage(JSON.stringify(data.errors || data.message || data));
            return;
        }
        setMessage("Market #" + id + " resolved: " + label);
        loadMarkets();
    }


    function logout() {
        localStorage.removeItem("token");
        window.location.assign(
            (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/admin/login/"
        );
    }

    const q = query.trim().toLowerCase();
    const filteredMarkets = useMemo(
        () =>
            markets.filter((m) => {
                if (!q) return true;
                return `${m.question} ${m.category} ${m.status}`.toLowerCase().includes(q);
            }),
        [markets, q]
    );
    const filteredUsers = useMemo(
        () =>
            users.filter((u) => {
                if (!q) return true;
                return `${u.username} ${u.name} ${u.email}`.toLowerCase().includes(q);
            }),
        [users, q]
    );

    const liveMarkets = markets.filter((m) => m.status === "open");
    const totalVolume = markets.reduce((s, m) => s + (Number(m.volume) || 0), 0);
    const totalTraders = markets.reduce((s, m) => s + (Number(m.traders_count) || 0), 0);
    const totalTokens = users.reduce((s, u) => s + (Number(u.wallet?.available) || 0), 0);
    const adminCount = users.filter((u) => u.is_admin).length;

    const categoryCards = ["Sports", "Finance", "Technology"].map((cat) => {
        const rows = markets.filter((m) => m.category === cat);
        const volume = rows.reduce((s, m) => s + (Number(m.volume) || 0), 0);
        const yes = rows.length
            ? Math.round(rows.reduce((s, m) => s + (Number(m.yes_price) || 0), 0) / rows.length)
            : 0;
        return { cat, volume, count: rows.length, yes, up: yes >= 50 };
    });

    const chartValues = liveMarkets.length
        ? [18, 24, 22, 32, 30, 41, 38, Math.max(12, Math.round(totalVolume / 2500))]
        : [12, 16, 14, 22, 20, 28, 26, 34];

    const recentMarkets = [...markets].sort((a, b) => b.id - a.id).slice(0, 5);
    const displayName = adminUser?.username || adminUser?.name || "Admin";
    const titles = {
        overview: "Overview",
        markets: "Markets",
        create: "Add market",
        users: "Users",
    };

    const notifications = useMemo(() => {
        const items = [];
        [...markets]
            .sort((a, b) => b.id - a.id)
            .slice(0, 3)
            .forEach((m) => {
                items.push({
                    id: `m-${m.id}`,
                    title: m.status === "open" ? "Market is live" : "Market updated",
                    body: m.question,
                    meta: m.category,
                    view: "markets",
                });
            });
        [...users]
            .sort((a, b) => b.id - a.id)
            .filter((u) => !u.is_admin)
            .slice(0, 2)
            .forEach((u) => {
                items.push({
                    id: `u-${u.id}`,
                    title: "New user joined",
                    body: u.username || u.name || u.email,
                    meta: "Users",
                    view: "users",
                });
            });
        return items;
    }, [markets, users]);

    function go(next) {
        setMessage("");
        setMenu(null);
        setView(next);
        if (next === "create") setForm(EMPTY_FORM);
        if (next === "users") loadUsers();
        if (next === "markets" || next === "overview") loadMarkets();
    }

    function openNotes() {
        setNotesRead(true);
        setMenu("notes");
    }

    useEffect(() => {
        function onDoc(e) {
            if (!topRightRef.current?.contains(e.target)) setMenu(null);
        }
        function onKey(e) {
            if (e.key === "Escape") setMenu(null);
        }
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    if (view === "loading") {
        return <Loader label="Checking admin" />;
    }

    return (
        <div className="adash">
            <aside className="adash-side">
                <Link href="/" className="adash-brand">
                    <span className="adash-mark" aria-hidden="true" />
                    <span>
                        <b>Polypredict</b>
                        <small>Admin console</small>
                    </span>
                </Link>

                <p className="adash-group">General</p>
                <button type="button" className={view === "overview" ? "on" : ""} onClick={() => go("overview")}>
                    <NavIcon>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
                    </NavIcon>
                    Overview
                </button>

                <p className="adash-group">Markets</p>
                <button type="button" className={view === "markets" ? "on" : ""} onClick={() => go("markets")}>
                    <NavIcon>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19V5" /><path d="M10 19V9" /><path d="M16 19V3" /><path d="M22 19H2" /></svg>
                    </NavIcon>
                    All markets
                </button>
                <button type="button" className={view === "create" ? "on" : ""} onClick={() => go("create")}>
                    <NavIcon>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
                    </NavIcon>
                    Add market
                </button>

                <p className="adash-group">People</p>
                <button type="button" className={view === "users" ? "on" : ""} onClick={() => go("users")}>
                    <NavIcon>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </NavIcon>
                    Users
                </button>

                <p className="adash-group">Site</p>
                <Link href="/" className="adash-link">
                    <NavIcon>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
                    </NavIcon>
                    View site
                </Link>
                <button type="button" onClick={logout}>
                    <NavIcon>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    </NavIcon>
                    Logout
                </button>

                <div className="adash-upgrade">
                    <span className="adash-upgrade-ico" aria-hidden="true">⚡</span>
                    <b>Live markets</b>
                    <p>Open the public board and watch odds move in real time.</p>
                    <Link href="/">Go to site</Link>
                </div>
            </aside>

            <div className="adash-body">
                <header className="adash-top">
                    <div>
                        <p className="adash-crumb">Dashboards</p>
                        <h1>{titles[view] || "Overview"}</h1>
                    </div>
                    <label className="adash-search">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" />
                            <path d="M21 21l-4.3-4.3" />
                        </svg>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search markets or users"
                        />
                    </label>
                    <div className="adash-top-right" ref={topRightRef}>
                        <div className="adash-menu-wrap">
                            <button
                                type="button"
                                className={`adash-bell${menu === "notes" ? " on" : ""}`}
                                aria-label="Notifications"
                                aria-expanded={menu === "notes"}
                                onClick={() => (menu === "notes" ? setMenu(null) : openNotes())}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                                </svg>
                                {!notesRead && notifications.length > 0 ? <i /> : null}
                            </button>
                            {menu === "notes" ? (
                                <div className="adash-drop adash-drop-notes" role="menu">
                                    <div className="adash-drop-head">
                                        <b>Notifications</b>
                                        <span>{notifications.length}</span>
                                    </div>
                                    {notifications.length === 0 ? (
                                        <p className="adash-drop-empty">No notifications yet.</p>
                                    ) : (
                                        notifications.map((n) => (
                                            <button
                                                key={n.id}
                                                type="button"
                                                className="adash-note"
                                                onClick={() => go(n.view)}
                                            >
                                                <strong>{n.title}</strong>
                                                <span>{n.body}</span>
                                                <small>{n.meta}</small>
                                            </button>
                                        ))
                                    )}
                                </div>
                            ) : null}
                        </div>
                        <div className="adash-menu-wrap">
                            <button
                                type="button"
                                className={`adash-profile${menu === "profile" ? " on" : ""}`}
                                aria-expanded={menu === "profile"}
                                onClick={() => setMenu(menu === "profile" ? null : "profile")}
                            >
                                <span className="adash-avatar">{initials(displayName)}</span>
                                <span>
                                    <b>{displayName}</b>
                                    <small>@{String(displayName).toLowerCase()}</small>
                                </span>
                                <svg className="adash-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </button>
                            {menu === "profile" ? (
                                <div className="adash-drop" role="menu">
                                    <button type="button" onClick={openNotes}>
                                        Notifications
                                    </button>
                                    <button type="button" className="danger" onClick={logout}>
                                        Logout
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </header>

                <main className="adash-main">
                    {message ? <p className="adash-flash">{message}</p> : null}

                    {view === "overview" && (
                        <section className="adash-overview">
                            <div className="adash-stats">
                                {categoryCards.map((c) => (
                                    <article key={c.cat} className="adash-stat">
                                        <p>{c.cat} volume</p>
                                        <h2>{formatCount(c.volume)}</h2>
                                        <div className="adash-stat-foot">
                                            <span className={c.up ? "up" : "down"}>
                                                {c.up ? "▲" : "▼"} {c.yes}% YES
                                            </span>
                                            <small>{c.count} markets</small>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="adash-mid">
                                <article className="adash-pass">
                                    <span>Admin access</span>
                                    <b>POLYPREDICT</b>
                                    <p>•••• •••• •••• {String(adminUser?.id || 1).padStart(4, "0")}</p>
                                    <em>{displayName}</em>
                                </article>

                                <article className="adash-actions">
                                    <h3>Quick actions</h3>
                                    <div className="adash-action-grid">
                                        <button type="button" onClick={() => go("create")}><i>+</i>Add</button>
                                        <button type="button" onClick={() => go("markets")}><i>▦</i>Markets</button>
                                        <button type="button" onClick={() => go("users")}><i>☺</i>Users</button>
                                        <Link href="/"><i>↗</i>Live</Link>
                                        <Link href="/portfolio"><i>◇</i>Portfolio</Link>
                                        <button type="button" onClick={() => go("overview")}><i>●</i>Overview</button>
                                        <Link href="/register"><i>✎</i>Invite</Link>
                                        <button type="button" onClick={logout}><i>⏻</i>Logout</button>
                                    </div>
                                </article>

                                <article className="adash-balance">
                                    <div className="adash-balance-top">
                                        <p>Platform volume</p>
                                        <span>All markets</span>
                                    </div>
                                    <h2>{formatCount(totalVolume)}</h2>
                                    <p className="adash-balance-sub">
                                        {formatCount(totalTraders)} traders · {liveMarkets.length} live
                                    </p>
                                    <div className="adash-balance-btns">
                                        <button type="button" onClick={() => go("create")}>Add market</button>
                                        <button type="button" className="ghost" onClick={() => go("markets")}>
                                            History
                                        </button>
                                    </div>
                                </article>
                            </div>

                            <div className="adash-bottom">
                                <article className="adash-cashflow">
                                    <div className="adash-cashflow-top">
                                        <h3>Volume flow</h3>
                                        <span>{formatCount(totalVolume)} total</span>
                                    </div>
                                    <VolumeChart values={chartValues} />
                                </article>
                                <article className="adash-activity">
                                    <h3>Recent markets</h3>
                                    <ul>
                                        {recentMarkets.length === 0 && <li className="empty">No markets yet.</li>}
                                        {recentMarkets.map((m) => (
                                            <li key={m.id}>
                                                <span className="adash-dot" data-cat={m.category} />
                                                <span>
                                                    <b>{m.question}</b>
                                                    <small>{m.category} · {m.status}</small>
                                                </span>
                                                <strong>{formatCount(m.volume)}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            </div>

                            <div className="adash-kpis">
                                <span><b>{markets.length}</b> markets</span>
                                <span><b>{users.length}</b> users</span>
                                <span><b>{adminCount}</b> admins</span>
                                <span><b>{formatCount(totalTokens)}</b> tokens free</span>
                            </div>
                        </section>
                    )}

                    {view === "markets" && (
                        <section className="adash-panel">
                            <div className="adash-panel-head">
                                <div>
                                    <h2>All markets</h2>
                                    <p className="adash-panel-meta">{filteredMarkets.length} shown</p>
                                </div>
                                <button type="button" className="adash-green" onClick={() => go("create")}>
                                    Add market
                                </button>
                            </div>
                            <div className="adash-table-wrap">
                                <table className="adash-table">
                                    <thead>
                                        <tr>
                                            <th className="num">ID</th>
                                            <th>Market</th>
                                            <th>Category</th>
                                            <th>Status</th>
                                            <th>Odds</th>
                                            <th className="num">Volume</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMarkets.map((m) => (
                                            <tr key={m.id}>
                                                <td className="num">
                                                    <span className="adash-id">#{m.id}</span>
                                                </td>
                                                <td>
                                                    <div className="adash-cell-main">
                                                        <b>{m.question}</b>
                                                        <small>{formatCount(m.traders_count)} traders</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="adash-cat" data-cat={m.category}>
                                                        {m.category}
                                                    </span>
                                                </td>
                                                <td>
                                                    <em className={`adash-pill ${m.status}`}>
                                                        <i />
                                                        {m.status}
                                                    </em>
                                                </td>
                                                <td>
                                                    <div className="adash-odds">
                                                        <span>
                                                            <b>{m.yes_price}%</b> YES
                                                        </span>
                                                        <span className="adash-odds-bar" aria-hidden="true">
                                                            <i style={{ width: `${m.yes_price}%` }} />
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="num adash-vol">{formatCount(m.volume)}</td>
                                                <td>
                                                    <Link href={`/markets/${m.id}`} className="adash-row-link">
                                                        View
                                                    </Link>
                                                    {m.status === "open" && (
                                                        <>
                                                            {" "}
                                                            <button
                                                                type="button"
                                                                className="btn-yes"
                                                                onClick={() => resolveMarket(m.id, "yes")}
                                                            >
                                                                YES won
                                                            </button>
                                                            {" "}
                                                            <button
                                                                type="button"
                                                                className="btn-no"
                                                                onClick={() => resolveMarket(m.id, "no")}
                                                            >
                                                                NO won
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredMarkets.length === 0 && <p className="adash-empty">No markets found.</p>}
                            </div>
                        </section>
                    )}

                    {view === "users" && (
                        <section className="adash-panel">
                            <div className="adash-panel-head">
                                <div>
                                    <h2>Registered users</h2>
                                    <p className="adash-panel-meta">{filteredUsers.length} shown</p>
                                </div>
                            </div>
                            <div className="adash-table-wrap">
                                <table className="adash-table">
                                    <thead>
                                        <tr>
                                            <th className="num">ID</th>
                                            <th>User</th>
                                            <th>Email</th>
                                            <th className="num">Tokens</th>
                                            <th>Role</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((u) => (
                                            <tr key={u.id}>
                                                <td className="num">
                                                    <span className="adash-id">#{u.id}</span>
                                                </td>
                                                <td>
                                                    <div className="adash-user-cell">
                                                        <span className="adash-mini-av">
                                                            {initials(u.username || u.name)}
                                                        </span>
                                                        <div className="adash-cell-main">
                                                            <b>{u.username || u.name}</b>
                                                            <small>{u.name && u.username ? u.name : "Member"}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="muted-cell">{u.email}</td>
                                                <td className="num adash-vol">{formatCount(u.wallet?.available ?? 0)}</td>
                                                <td>
                                                    <em className={`adash-pill ${u.is_admin ? "open" : "draft"}`}>
                                                        {u.is_admin ? "admin" : "trader"}
                                                    </em>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredUsers.length === 0 && <p className="adash-empty">No users found.</p>}
                            </div>
                        </section>
                    )}

                    {view === "create" && (
                        <section className="adash-panel">
                            <div className="adash-panel-head">
                                <h2>New market</h2>
                            </div>
                            <form className="adash-form" onSubmit={onCreate}>
                                <label>
                                    Question
                                    <input
                                        value={form.question}
                                        onChange={(e) => setField("question", e.target.value)}
                                        required
                                    />
                                </label>
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
                                <div className="adash-form-row">
                                    <label>
                                        Close date
                                        <input
                                            type="date"
                                            value={form.closes_date}
                                            onChange={(e) => setField("closes_date", e.target.value)}
                                            required
                                        />
                                    </label>
                                    <label>
                                        Close time
                                        <input
                                            type="time"
                                            step="60"
                                            value={form.closes_time}
                                            onChange={(e) => setField("closes_time", e.target.value)}
                                            required
                                        />
                                    </label>
                                </div>
                                <label>
                                    Resolution rules
                                    <input
                                        value={form.resolution_rules}
                                        onChange={(e) => setField("resolution_rules", e.target.value)}
                                        required
                                    />
                                </label>
                                <label>
                                    Resolution source
                                    <input
                                        value={form.resolution_source}
                                        onChange={(e) => setField("resolution_source", e.target.value)}
                                        required
                                    />
                                </label>
                                <div className="adash-form-row">
                                    <label>
                                        Liquidity (b)
                                        <select value={form.b} onChange={(e) => setField("b", e.target.value)}>
                                            <option value="100">100 (fast)</option>
                                            <option value="150">150 (normal)</option>
                                            <option value="500">500 (slow)</option>
                                        </select>
                                    </label>
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
                                </div>
                                <button type="submit" className="adash-green">Create market</button>
                            </form>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}
