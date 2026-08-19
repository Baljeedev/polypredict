import Link from "next/link";
import SiteNav from "./SiteNav";

export const dynamic = "force-dynamic";

const API = process.env.NEXT_PUBLIC_API_URL;

async function getMarkets() {
  const res = await fetch(`${API}/api/markets`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const category = params.category || "";
  const url = category
    ? `${API}/api/markets?category=${encodeURIComponent(category)}`
    : `${API}/api/markets`;
  const res = await fetch(url, { cache: "no-store" });
  const markets = res.ok ? await res.json() : [];

  return (
    <>
      <SiteNav />

      <nav className="cats">
        <Link href="/">Trending</Link>
        <Link href="/?category=Finance">Finance</Link>
        <Link href="/?category=Sports">Sports</Link>
        <Link href="/?category=Technology">Technology</Link>
        <Link href="/?category=Entertainment">Entertainment</Link>
        <Link href="/?category=Current affairs">Current affairs</Link>
    </nav>

      {/* <p className="muted">IDs: {markets.map((m) => m.id).join(", ")}</p> */}

      <div className="market-grid">
        {markets.length === 0 && <p>No open markets yet.</p>}
        {markets.map((m) => (
          <Link href={`/markets/${m.id}`} className="card" key={m.id}>
            <p className="live">● LIVE</p>
            <h2>{m.question}</h2>
            <p className="muted">{m.category}</p>
            <p>
              <span className="pct-yes">YES {m.yes_price}%</span>
              <span className="pct-no">NO {m.no_price}%</span>
            </p>
            <p className="muted">
              {m.traders_count} traders · {m.volume} tokens
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}