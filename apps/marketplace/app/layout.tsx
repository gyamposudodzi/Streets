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
      <body>
        <header className="topbar">
          <SessionStatus />
        </header>
        {children}
      </body>
    </html>
  );
}
