"use client";

import { useEffect, useState } from "react";

import { getAdminDashboard, loginUser, registerUser } from "@streets/api-client";
import type { AdminDashboard as AdminDashboardData, AuthSession } from "@streets/types";

const sessionStorageKey = "streets.admin.session";

function readSession(): AuthSession | null {
  const raw = window.localStorage.getItem(sessionStorageKey);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

function writeSession(session: AuthSession) {
  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
}

export function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setSession(readSession());
  }, []);

  useEffect(() => {
    if (!session || session.user.role !== "admin") {
      return;
    }

    async function loadDashboard() {
      setError("");
      try {
        const data = await getAdminDashboard(session.access_token);
        setDashboard(data);
      } catch {
        setError("Failed to load admin dashboard data.");
      }
    }

    loadDashboard();
  }, [session]);

  async function handleRegisterAdmin() {
    setError("");
    setMessage("");
    setIsBusy(true);
    try {
      await registerUser({
        email,
        role: "admin",
        is_age_verified: true
      });
      const nextSession = await loginUser({ email });
      writeSession(nextSession);
      setSession(nextSession);
      setMessage("Admin session created.");
    } catch {
      setError("Admin registration failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLoginAdmin() {
    setError("");
    setMessage("");
    setIsBusy(true);
    try {
      const nextSession = await loginUser({ email });
      writeSession(nextSession);
      setSession(nextSession);
      setMessage("Admin signed in.");
    } catch {
      setError("Admin login failed.");
    } finally {
      setIsBusy(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(sessionStorageKey);
    setSession(null);
    setDashboard(null);
    setMessage("");
  }

  if (!session) {
    return (
      <section className="hero">
        <p className="eyebrow">Streets Admin</p>
        <h1>Operations foundation</h1>
        <p>
          Create or load a development admin session to review users, creators, services,
          and bookings from the protected admin API.
        </p>
        <div className="stack">
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
          />
          {error ? <p className="errorText">{error}</p> : null}
          <div className="actions">
            <button className="button" type="button" onClick={handleRegisterAdmin} disabled={isBusy}>
              {isBusy ? "Working..." : "Create admin session"}
            </button>
            <button className="button secondaryButton" type="button" onClick={handleLoginAdmin} disabled={isBusy}>
              {isBusy ? "Working..." : "Sign in"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (session.user.role !== "admin") {
    return (
      <section className="hero">
        <p className="eyebrow">Streets Admin</p>
        <h1>Admin access required</h1>
        <p>The current session is not an admin account.</p>
        <button className="button" type="button" onClick={handleLogout}>
          Clear session
        </button>
      </section>
    );
  }

  return (
    <section className="hero stack">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Streets Admin</p>
          <h1>Operations dashboard</h1>
          <p>{session.user.email}</p>
        </div>
        <button className="button secondaryButton" type="button" onClick={handleLogout}>
          Sign out
        </button>
      </div>

      {message ? <p>{message}</p> : null}
      {error ? <p className="errorText">{error}</p> : null}

      {dashboard ? (
        <>
          <div className="grid">
            <article className="card">
              <h2>Users</h2>
              <p>{dashboard.overview.total_users}</p>
            </article>
            <article className="card">
              <h2>Creators</h2>
              <p>{dashboard.overview.total_creators}</p>
            </article>
            <article className="card">
              <h2>Services</h2>
              <p>{dashboard.overview.total_services}</p>
            </article>
            <article className="card">
              <h2>Bookings</h2>
              <p>{dashboard.overview.total_bookings}</p>
            </article>
          </div>

          <section className="card stack">
            <h2>Users</h2>
            {dashboard.users.map((user) => (
              <div key={user.id} className="row">
                <span>{user.email}</span>
                <span>{user.role}</span>
                <span>{user.status}</span>
              </div>
            ))}
          </section>

          <section className="card stack">
            <h2>Creators</h2>
            {dashboard.creators.map((creator) => (
              <div key={creator.user_id} className="row">
                <span>{creator.display_name}</span>
                <span>{creator.service_region}</span>
                <span>{creator.verification_status}</span>
              </div>
            ))}
          </section>

          <section className="card stack">
            <h2>Services</h2>
            {dashboard.services.map((service) => (
              <div key={service.id} className="row">
                <span>{service.title}</span>
                <span>{service.fulfillment_type}</span>
                <span>{service.is_active ? "active" : "inactive"}</span>
              </div>
            ))}
          </section>

          <section className="card stack">
            <h2>Bookings</h2>
            {dashboard.bookings.length > 0 ? (
              dashboard.bookings.map((booking) => (
                <div key={booking.id} className="row">
                  <span>{booking.id}</span>
                  <span>{booking.fulfillment_type}</span>
                  <span>{booking.status}</span>
                </div>
              ))
            ) : (
              <p>No bookings yet.</p>
            )}
          </section>
        </>
      ) : (
        <p>Loading dashboard...</p>
      )}
    </section>
  );
}
