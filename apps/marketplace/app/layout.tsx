import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Streets Marketplace",
  description: "Marketplace shell for Streets"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
