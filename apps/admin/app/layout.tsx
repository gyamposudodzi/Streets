import "./globals.css";
import type { ReactNode } from "react";
import { DM_Sans, Fraunces } from "next/font/google";

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
  title: "Streets Admin",
  description: "Operations and moderation for the Streets platform."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body suppressHydrationWarning>
        <header className="adminTopbar">
          <div className="adminTopbarInner">
            <div className="adminBrand">
              <span className="adminBrandDot" aria-hidden />
              <span className="adminBrandText">Streets</span>
              <span className="adminBrandBadge">Admin</span>
            </div>
            <p className="adminTopbarTagline">Moderation, funds, and trust operations</p>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
