import { Outfit, Figtree, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import SiteFooter from "./SiteFooter";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
});

const plex = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Polypredict",
  description: "Trade live prediction markets",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${figtree.variable} ${dmSans.variable} ${plex.variable}`}
    >
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
