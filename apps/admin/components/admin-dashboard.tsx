"use client";

import { useEffect, useState } from "react";

import {
  acceptBooking,
  adminApproveService,
  adminRefundBooking,
  adminRejectService,
  adminReleaseBooking,
  adminResolveReport,
  cancelBooking,
  getAdminDashboard,
  getBookingPaymentState,
  loginUser,
  registerUser
} from "@streets/api-client";
import type {
  AdminDashboard as AdminDashboardData,
  AuthSession,
  BookingPaymentState
} from "@streets/types";

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
  const [paymentStates, setPaymentStates] = useState<Record<string, BookingPaymentState>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setSession(readSession());
  }, []);

  useEffect(() => {
    const currentSession = session;
    if (!currentSession || currentSession.user.role !== "admin") {
      return;
    }
    const accessToken = currentSession.access_token;

    async function loadDashboard() {
      setError("");
      try {
        const data = await getAdminDashboard(accessToken);
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

  async function handleLoadPaymentState(bookingId: string) {
    setError("");
    try {
      const state = await getBookingPaymentState(bookingId);
      setPaymentStates((current) => ({ ...current, [bookingId]: state }));
    } catch {
      setError("Failed to load booking payment state.");
    }
  }

  async function reloadDashboard(accessToken: string) {
    const data = await getAdminDashboard(accessToken);
    setDashboard(data);
  }

  async function handleReleaseBooking(bookingId: string) {
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await adminReleaseBooking(bookingId, session.access_token);
      await handleLoadPaymentState(bookingId);
      await reloadDashboard(session.access_token);
      setMessage("Held funds released.");
    } catch {
      setError("Release failed. Confirm this booking has held funds.");
    }
  }

  async function handleRefundBooking(bookingId: string) {
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await adminRefundBooking(bookingId, session.access_token);
      await handleLoadPaymentState(bookingId);
      await reloadDashboard(session.access_token);
      setMessage("Held funds refunded.");
    } catch {
      setError("Refund failed. Confirm this booking has held funds.");
    }
  }

  async function handleAcceptBooking(bookingId: string) {
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await acceptBooking(bookingId, session.access_token);
      await reloadDashboard(session.access_token);
      setMessage("Booking accepted.");
    } catch {
      setError("Accept failed. Confirm the booking is paid and pending acceptance.");
    }
  }

  async function handleCancelBooking(bookingId: string) {
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await cancelBooking(bookingId, session.access_token);
      await reloadDashboard(session.access_token);
      setMessage("Booking cancelled.");
    } catch {
      setError("Cancel failed. Confirm the booking can still be cancelled.");
    }
  }

  async function handleApproveService(serviceId: string) {
    if (!session) {
      return;
    }
    setError("");
    setMessage("");
    try {
      await adminApproveService(serviceId, session.access_token);
      await reloadDashboard(session.access_token);
      setMessage("Service approved.");
    } catch {
      setError("Service approval failed.");
    }
  }

  async function handleRejectService(serviceId: string) {
    if (!session) {
      return;
    }
    setError("");
    setMessage("");
    try {
      await adminRejectService(serviceId, session.access_token);
      await reloadDashboard(session.access_token);
      setMessage("Service rejected.");
    } catch {
      setError("Service rejection failed.");
    }
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
            <article className="card">
              <h2>Open reports</h2>
              <p>{dashboard.overview.open_reports}</p>
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
              <div key={service.id} className="stack bookingRow">
                <div className="row">
                  <span>{service.title}</span>
                  <span>{service.fulfillment_type}</span>
                  <span>{service.moderation_status}</span>
                </div>
                <div className="actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => handleApproveService(service.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="button secondaryButton"
                    type="button"
                    onClick={() => handleRejectService(service.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="card stack">
            <h2>Reports</h2>
            {dashboard.reports.length > 0 ? (
              dashboard.reports.map((report) => (
                <div key={report.id} className="stack bookingRow">
                  <div className="row">
                    <span>{report.target_type}</span>
                    <span>{report.reason}</span>
                    <span>{report.status}</span>
                  </div>
                  <p>Risk score: {report.risk_score}</p>
                  {report.details ? <p>{report.details}</p> : null}
                  <div className="actions">
                    <button
                      className="button"
                      type="button"
                      onClick={async () => {
                        if (!session) return;
                        await adminResolveReport(report.id, "reviewing", session.access_token);
                        await reloadDashboard(session.access_token);
                      }}
                    >
                      Mark reviewing
                    </button>
                    <button
                      className="button"
                      type="button"
                      onClick={async () => {
                        if (!session) return;
                        await adminResolveReport(report.id, "resolved", session.access_token);
                        await reloadDashboard(session.access_token);
                      }}
                    >
                      Resolve
                    </button>
                    <button
                      className="button secondaryButton"
                      type="button"
                      onClick={async () => {
                        if (!session) return;
                        await adminResolveReport(report.id, "dismissed", session.access_token);
                        await reloadDashboard(session.access_token);
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No reports yet.</p>
            )}
          </section>

          <section className="card stack">
            <h2>Bookings</h2>
            {dashboard.bookings.length > 0 ? (
              dashboard.bookings.map((booking) => (
                <div key={booking.id} className="stack bookingRow">
                  <div className="row">
                    <span>{booking.id}</span>
                    <span>{booking.fulfillment_type}</span>
                    <span>{booking.status}</span>
                  </div>
                  <button
                    className="button secondaryButton"
                    type="button"
                    onClick={() => handleLoadPaymentState(booking.id)}
                  >
                    Load payment state
                  </button>
                  {booking.status === "paid_pending_acceptance" ||
                  booking.status === "accepted" ? (
                    <div className="actions">
                      {booking.status === "paid_pending_acceptance" ? (
                        <button
                          className="button"
                          type="button"
                          onClick={() => handleAcceptBooking(booking.id)}
                        >
                          Accept
                        </button>
                      ) : null}
                      <button
                        className="button"
                        type="button"
                        onClick={() => handleReleaseBooking(booking.id)}
                      >
                        Release funds
                      </button>
                      <button
                        className="button secondaryButton"
                        type="button"
                        onClick={() => handleRefundBooking(booking.id)}
                      >
                        Refund buyer
                      </button>
                    </div>
                  ) : null}
                  {!["cancelled", "released", "refunded"].includes(booking.status) ? (
                    <button
                      className="button secondaryButton"
                      type="button"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Cancel booking
                    </button>
                  ) : null}
                  {paymentStates[booking.id] ? (
                    <div className="paymentState">
                      <p>Payments: {paymentStates[booking.id].payments.length}</p>
                      <p>Held funds: {paymentStates[booking.id].held_funds.length}</p>
                      <p>Ledger entries: {paymentStates[booking.id].ledger_entries.length}</p>
                      {paymentStates[booking.id].ledger_entries.map((entry) => (
                        <p key={entry.id}>
                          {entry.entry_type}: {entry.amount} {entry.currency}
                        </p>
                      ))}
                    </div>
                  ) : null}
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
