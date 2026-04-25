import "./globals.css";
import type { ReactNode } from "react";
import { DM_Sans, Fraunces } from "next/font/google";

import { SessionStatus } from "../components/session-status";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata = {
  title: "Streets — meet creators, book the vibe",
  description: "A visual place to find people, see what they offer, and book sessions—fast."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body suppressHydrationWarning>
        <header className="topbar">
          <a className="brandMark" href="/">
            <span className="brandDot" aria-hidden />
            <span className="brandWordmark">Streets</span>
          </a>
          <SessionStatus />
        </header>
        {children}
      </body>
    </html>
  );
}
