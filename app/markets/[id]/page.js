import Client from "./Client";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API}/api/markets`);
    const markets = await res.json();
    if (!Array.isArray(markets) || markets.length === 0) {
      return [{ id: "1" }, { id: "2" }, { id: "3" }];
    }
    return markets.map((m) => ({ id: String(m.id) }));
  } catch {
    return [{ id: "1" }, { id: "2" }, { id: "3" }];
  }
}

export default async function MarketPage({ params }) {
  const { id } = await params;
  return <Client id={id} />;
}