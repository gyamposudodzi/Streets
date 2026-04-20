import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Streets Admin",
  description: "Admin shell for Streets"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
