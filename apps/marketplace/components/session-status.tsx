"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { AuthSession } from "@streets/types";

import { AUTH_SESSION_KEY } from "../lib/auth-session";

const nav = [
  { href: "/", label: "Feed" },
  { href: "/search", label: "Explore" },
  { href: "/creator", label: "Your page" }
] as const;

function navLinkClass(pathname: string, href: string) {
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return `sessionNavLink${active ? " sessionNavLinkActive" : ""}`;
}

function readSession(): AuthSession | null {
  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function SessionStatus() {
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const sync = () => setSession(readSession());
    sync();
    window.addEventListener("streets-auth-changed", sync);
    return () => window.removeEventListener("streets-auth-changed", sync);
  }, []);

  const returnPath = pathname === "/auth" ? "/" : pathname;
  const accountHref = session ? "/auth" : `/auth?next=${encodeURIComponent(returnPath)}`;
  const accountLabel = session ? session.user.email.split("@")[0] ?? session.user.email : "Join";

  return (
    <div className="sessionStatus" role="navigation" aria-label="Primary">
      <div className="sessionShell">
        {nav.map(({ href, label }) => (
          <Link key={href} href={href} className={navLinkClass(pathname, href)}>
            {label}
          </Link>
        ))}
        <Link href={accountHref} className="sessionNavCta">
          {accountLabel}
        </Link>
      </div>
    </div>
  );
}
