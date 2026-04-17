"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { AuthSession } from "@streets/types";

const sessionStorageKey = "streets.session";

export function SessionStatus() {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(sessionStorageKey);
    setSession(raw ? (JSON.parse(raw) as AuthSession) : null);
  }, []);

  return (
    <div className="sessionStatus">
      <Link href="/">Home</Link>
      <Link href="/search">Search</Link>
      <Link href="/creator">Creator</Link>
      <Link href="/auth">{session ? session.user.email : "Sign in"}</Link>
    </div>
  );
}
