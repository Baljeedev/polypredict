"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const path = usePathname() || "";
  if (path.startsWith("/admin")) return null;

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Link href="/" className="logo">
            <span className="logo-mark" aria-hidden="true" />
            Polypredict
          </Link>
          <p>Virtual-token prediction markets. No real money. No cash-out.</p>
        </div>
        <div>
          <h3>Product</h3>
          <Link href="/">Markets</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/traders">Search traders</Link>
        </div>
        <div>
          <h3>Company</h3>
          <Link href="/profile">Profile</Link>
          <Link href="/register">Sign up</Link>
          <Link href="/user/login">Log in</Link>
        </div>
        <div>
          <h3>Help</h3>
          <Link href="/forgot-password">Forgot password</Link>
          <Link href="/leaderboard">Experts</Link>
          <Link href="/portfolio">Wallet</Link>
        </div>
      </div>
      <p className="site-footer-copy">
        © {new Date().getFullYear()} Polypredict. Tokens are virtual only and have no cash value.
      </p>
    </footer>
  );
}
