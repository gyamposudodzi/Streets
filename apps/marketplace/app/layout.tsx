import "./globals.css";
import type { ReactNode } from "react";

import { SessionStatus } from "../components/session-status";

export const metadata = {
  title: "Streets Marketplace",
  description: "Marketplace shell for Streets"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <header className="topbar">
          <a className="brandMark" href="/">
            <span className="brandDot" />
            Streets
          </a>
          <SessionStatus />
        </header>
        {children}
      </body>
    </html>
  );
}
