import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

export default async function MarketPage({ params }) {
  const { id } = await params;
  const res = await fetch(`${API}/api/markets/${id}`, { cache: "no-store" });
  if (!res.ok) return <p>Market not found</p>;
  const m = await res.json();

  return (
    <>
      <header className="nav">
        <Link href="/" className="logo">Polypredict</Link>
        <div>
          <Link href="/login">Log in</Link>{" "}
          <Link href="/register" className="btn-green">Sign up</Link>
        </div>
      </header>

      <main className="card market-page">
        <p className="muted">{m.category} · {m.status}</p>
        <h1>{m.question}</h1>
        <p>
          <span className="pct-yes">YES {m.yes_price}%</span>
          <span className="pct-no">NO {m.no_price}%</span>
        </p>
        <p className="muted">
          {m.traders_count} traders · {m.volume} tokens · source: {m.resolution_source}
        </p>
        <p>{m.resolution_rules}</p>
        <p className="hint">Buy/Sell next step.</p>
      </main>
    </>
  );
}