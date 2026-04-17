"use client";

import { useEffect, useState } from "react";

import { loginUser, registerUser } from "@streets/api-client";
import type { AuthSession } from "@streets/types";

const sessionStorageKey = "streets.session";

function saveSession(session: AuthSession) {
  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
}

function readSession(): AuthSession | null {
  const raw = window.localStorage.getItem(sessionStorageKey);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "creator">("user");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setSession(readSession());
  }, []);

  async function handleRegister() {
    setError("");
    setIsBusy(true);
    try {
      await registerUser({
        email,
        role,
        is_age_verified: true
      });
      const nextSession = await loginUser({ email });
      saveSession(nextSession);
      setSession(nextSession);
    } catch {
      setError("Registration failed. Try another email or verify the backend is running.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogin() {
    setError("");
    setIsBusy(true);
    try {
      const nextSession = await loginUser({ email });
      saveSession(nextSession);
      setSession(nextSession);
    } catch {
      setError("Login failed. Register first or verify the backend is running.");
    } finally {
      setIsBusy(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(sessionStorageKey);
    setSession(null);
  }

  return (
    <section className="panel">
      <p className="eyebrow">Auth</p>
      <h1>Buyer session</h1>
      <p>
        This development auth flow stores a local marketplace session after registration
        or login so booking can use the authenticated buyer automatically.
      </p>
      {session ? (
        <article className="card stack">
          <h3>Signed in</h3>
          <p>{session.user.email}</p>
          <p>
            Role: {session.user.role} - User ID: {session.user.id}
          </p>
          <button className="button" type="button" onClick={handleLogout}>
            Sign out
          </button>
        </article>
      ) : (
        <div className="stack">
          <label className="stack">
            <span>Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="buyer@example.com"
            />
          </label>
          <label className="stack">
            <span>Account type</span>
            <select
              className="input"
              value={role}
              onChange={(event) => setRole(event.target.value as "user" | "creator")}
            >
              <option value="user">Buyer</option>
              <option value="creator">Creator</option>
            </select>
          </label>
          {error ? <p className="errorText">{error}</p> : null}
          <div className="actions">
            <button className="button" type="button" onClick={handleRegister} disabled={isBusy}>
              {isBusy ? "Working..." : "Register and sign in"}
            </button>
            <button
              className="button secondaryButton"
              type="button"
              onClick={handleLogin}
              disabled={isBusy}
            >
              {isBusy ? "Working..." : "Sign in"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
