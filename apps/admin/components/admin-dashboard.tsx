"use client";

import { useEffect, useState } from "react";

import {
  acceptBooking,
  adminApproveService,
  adminRefundBooking,
  adminRejectService,
  adminReleaseBooking,
  adminResolveDispute,
  adminResolveReport,
  cancelBooking,
  createModerationRule,
  declineBooking,
  getAdminDashboard,
  getBookingPaymentState,
  loginUser,
  registerUser,
  updateModerationRule
} from "@streets/api-client";
import type {
  AdminDashboard as AdminDashboardData,
  AuthSession,
  BookingPaymentState,
  BookingStatus,
  DisputeStatus,
  ReportStatus,
  ServiceModerationStatus
} from "@streets/types";

const sessionStorageKey = "streets.admin.session";

type AdminSection =
  | "overview"
  | "services"
  | "bookings"
  | "reports"
  | "disputes"
  | "rules"
  | "audit";

type IdentitySection = "users" | "creators";
type ServiceFilter = ServiceModerationStatus | "all";
type BookingFilter = "action_needed" | "active" | "disputed" | "completed" | "all";
type ReportFilter = ReportStatus | "all";
type DisputeFilter = DisputeStatus | "all";

const adminSections: Array<{ id: AdminSection; label: string; helper: string }> = [
  {
    id: "overview",
    label: "Overview",
    helper: "Users, creators, and platform totals"
  },
  {
    id: "services",
    label: "Services",
    helper: "Listing review and public visibility"
  },
  {
    id: "bookings",
    label: "Bookings & payments",
    helper: "Booking state, held funds, release, and refunds"
  },
  {
    id: "reports",
    label: "Reports",
    helper: "Safety reports and review queue"
  },
  {
    id: "disputes",
    label: "Disputes",
    helper: "Buyer and creator dispute decisions"
  },
  {
    id: "rules",
    label: "Wording rules",
    helper: "Admin-controlled public listing scan rules"
  },
  {
    id: "audit",
    label: "Audit logs",
    helper: "Immutable admin action history"
  }
];

const identitySections: Array<{ id: IdentitySection; label: string; helper: string }> = [
  {
    id: "users",
    label: "Users",
    helper: "Buyer, creator, and admin accounts"
  },
  {
    id: "creators",
    label: "Creators",
    helper: "Creator profiles and verification status"
  }
];

const serviceFilters: Array<{ id: ServiceFilter; label: string }> = [
  { id: "pending_review", label: "Pending review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" }
];

const bookingFilters: Array<{ id: BookingFilter; label: string }> = [
  { id: "action_needed", label: "Action needed" },
  { id: "active", label: "Active" },
  { id: "disputed", label: "Disputed" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" }
];

const reportFilters: Array<{ id: ReportFilter; label: string }> = [
  { id: "open", label: "Open" },
  { id: "reviewing", label: "Reviewing" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
  { id: "all", label: "All" }
];

const disputeFilters: Array<{ id: DisputeFilter; label: string }> = [
  { id: "open", label: "Open" },
  { id: "reviewing", label: "Reviewing" },
  { id: "resolved", label: "Resolved" },
  { id: "all", label: "All" }
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function containsSearch(values: Array<string | null | undefined>, search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) {
    return true;
  }

  return values.some((value) => value?.toLowerCase().includes(normalizedSearch));
}

function bookingMatchesFilter(status: BookingStatus, filter: BookingFilter) {
  if (filter === "action_needed") {
    return status === "paid_pending_acceptance";
  }

  if (filter === "active") {
    return ["accepted", "in_progress", "delivered", "awaiting_release"].includes(status);
  }

  if (filter === "disputed") {
    return status === "disputed";
  }

  if (filter === "completed") {
    return ["released", "refunded", "declined", "cancelled"].includes(status);
  }

  return true;
}

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
  const [rulePattern, setRulePattern] = useState("");
  const [ruleLabel, setRuleLabel] = useState("");
  const [ruleAction, setRuleAction] = useState("hold");
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [activeIdentitySection, setActiveIdentitySection] = useState<IdentitySection>("users");
  const [queueSearch, setQueueSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("pending_review");
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>("action_needed");
  const [reportFilter, setReportFilter] = useState<ReportFilter>("open");
  const [disputeFilter, setDisputeFilter] = useState<DisputeFilter>("open");

  const filteredServices =
    dashboard?.services.filter(
      (service) =>
        (serviceFilter === "all" || service.moderation_status === serviceFilter) &&
        containsSearch(
          [
            service.id,
            service.title,
            service.description,
            service.category,
            service.fulfillment_type,
            service.moderation_status,
            service.compliance_notes
          ],
          queueSearch
        )
    ) ?? [];
  const filteredBookings =
    dashboard?.bookings.filter(
      (booking) =>
        bookingMatchesFilter(booking.status, bookingFilter) &&
        containsSearch(
          [booking.id, booking.buyer_id, booking.creator_id, booking.service_id, booking.fulfillment_type, booking.status],
          queueSearch
        )
    ) ?? [];
  const filteredReports =
    dashboard?.reports.filter(
      (report) =>
        (reportFilter === "all" || report.status === reportFilter) &&
        containsSearch(
          [report.id, report.target_type, report.target_id, report.reason, report.details, report.status],
          queueSearch
        )
    ) ?? [];
  const filteredDisputes =
    dashboard?.disputes.filter(
      (dispute) =>
        (disputeFilter === "all" || dispute.status === disputeFilter) &&
        containsSearch(
          [dispute.id, dispute.booking_id, dispute.reason, dispute.details, dispute.resolution, dispute.status],
          queueSearch
        )
    ) ?? [];

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

  async function handleDeclineBooking(bookingId: string) {
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await declineBooking(bookingId, session.access_token);
      await reloadDashboard(session.access_token);
      setMessage("Booking declined and buyer funds refunded.");
    } catch {
      setError("Decline failed. Confirm the booking is paid and pending creator acceptance.");
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

  async function handleResolveDispute(disputeId: string, resolution: "release" | "refund") {
    if (!session) {
      return;
    }
    setError("");
    setMessage("");
    try {
      await adminResolveDispute(disputeId, resolution, session.access_token);
      await reloadDashboard(session.access_token);
      setMessage(`Dispute resolved with ${resolution}.`);
    } catch {
      setError("Dispute resolution failed. Confirm the booking has held funds.");
    }
  }

  async function handleCreateModerationRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }
    setError("");
    setMessage("");
    try {
      await createModerationRule(
        {
          pattern: rulePattern,
          label: ruleLabel,
          action: ruleAction,
          is_active: true
        },
        session.access_token
      );
      setRulePattern("");
      setRuleLabel("");
      setRuleAction("hold");
      await reloadDashboard(session.access_token);
      setMessage("Public wording rule created.");
    } catch {
      setError("Could not create public wording rule.");
    }
  }

  async function handleToggleModerationRule(ruleId: string, isActive: boolean) {
    if (!session) {
      return;
    }
    setError("");
    setMessage("");
    try {
      await updateModerationRule(ruleId, { is_active: !isActive }, session.access_token);
      await reloadDashboard(session.access_token);
      setMessage("Public wording rule updated.");
    } catch {
      setError("Could not update public wording rule.");
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
          <nav className="dashboardSubnav" aria-label="Admin dashboard sections">
            {adminSections.map((section) => (
              <button
                key={section.id}
                className={
                  activeSection === section.id
                    ? "subnavButton activeSubnavButton"
                    : "subnavButton"
                }
                type="button"
                onClick={() => {
                  setActiveSection(section.id);
                  setQueueSearch("");
                }}
              >
                <span>{section.label}</span>
                <small>{section.helper}</small>
              </button>
            ))}
          </nav>

          {activeSection === "overview" ? (
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
                <article className="card">
                  <h2>Open disputes</h2>
                  <p>{dashboard.overview.open_disputes}</p>
                </article>
              </div>

              <section className="card stack">
                <div className="panelHeader compactPanelHeader">
                  <div>
                    <p className="eyebrow">Identity</p>
                    <h2>People directory</h2>
                  </div>
                  <div className="sectionCount">
                    {dashboard.users.length} users / {dashboard.creators.length} creators
                  </div>
                </div>
                <nav className="miniSubnav" aria-label="Identity sections">
                  {identitySections.map((section) => (
                    <button
                      key={section.id}
                      className={
                        activeIdentitySection === section.id
                          ? "miniSubnavButton activeMiniSubnavButton"
                          : "miniSubnavButton"
                      }
                      type="button"
                      onClick={() => setActiveIdentitySection(section.id)}
                    >
                      <span>{section.label}</span>
                      <small>{section.helper}</small>
                    </button>
                  ))}
                </nav>

                {activeIdentitySection === "users" ? (
                  <div className="stack">
                    <h2>Users</h2>
                    {dashboard.users.map((user) => (
                      <div key={user.id} className="row">
                        <span>{user.email}</span>
                        <span>{user.role}</span>
                        <span>{user.status}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {activeIdentitySection === "creators" ? (
                  <div className="stack">
                    <h2>Creators</h2>
                    {dashboard.creators.map((creator) => (
                      <div key={creator.user_id} className="row">
                        <span>{creator.display_name}</span>
                        <span>{creator.service_region}</span>
                        <span>{creator.verification_status}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            </>
          ) : null}

          {activeSection === "services" ? (
          <section className="card stack">
            <div className="panelHeader compactPanelHeader">
              <div>
                <h2>Services</h2>
                <p>Review public listing visibility and moderation outcomes.</p>
              </div>
              <div className="sectionCount">
                {filteredServices.length} of {dashboard.services.length}
              </div>
            </div>
            <div className="queueToolbar">
              <div className="filterChips" aria-label="Service filters">
                {serviceFilters.map((filter) => (
                  <button
                    key={filter.id}
                    className={
                      serviceFilter === filter.id ? "filterChip activeFilterChip" : "filterChip"
                    }
                    type="button"
                    onClick={() => setServiceFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <input
                className="input queueSearch"
                value={queueSearch}
                onChange={(event) => setQueueSearch(event.target.value)}
                placeholder="Search services, categories, notes..."
              />
            </div>
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
              <div key={service.id} className="stack bookingRow">
                <div className="row">
                  <span>{service.title}</span>
                  <span>{service.fulfillment_type}</span>
                  <span>{service.moderation_status}</span>
                </div>
                {service.compliance_score > 0 ? (
                  <p>
                    Compliance score {service.compliance_score}: {service.compliance_notes}
                  </p>
                ) : (
                  <p>Auto-approved public wording.</p>
                )}
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
              ))
            ) : (
              <p>No services match this queue.</p>
            )}
          </section>
          ) : null}

          {activeSection === "rules" ? (
          <section className="card stack">
            <h2>Public wording rules</h2>
            <p>
              These admin-controlled rules scan public service listings. Clean listings
              auto-approve; held listings stay out of public discovery until reviewed.
            </p>
            <form className="stack formShell" onSubmit={handleCreateModerationRule}>
              <input
                className="input"
                value={rulePattern}
                onChange={(event) => setRulePattern(event.target.value)}
                placeholder="Pattern, word, or phrase"
              />
              <input
                className="input"
                value={ruleLabel}
                onChange={(event) => setRuleLabel(event.target.value)}
                placeholder="Admin label"
              />
              <select
                className="input"
                value={ruleAction}
                onChange={(event) => setRuleAction(event.target.value)}
              >
                <option value="hold">Hold for review</option>
                <option value="flag">Flag only</option>
              </select>
              <button
                className="button"
                type="submit"
                disabled={!rulePattern.trim() || !ruleLabel.trim()}
              >
                Add rule
              </button>
            </form>
            {dashboard.moderation_rules.map((rule) => (
              <div key={rule.id} className="stack bookingRow">
                <div className="row">
                  <span>{rule.pattern}</span>
                  <span>{rule.label}</span>
                  <span>{rule.action}</span>
                  <span>{rule.is_active ? "active" : "inactive"}</span>
                </div>
                <button
                  className="button secondaryButton"
                  type="button"
                  onClick={() => handleToggleModerationRule(rule.id, rule.is_active)}
                >
                  {rule.is_active ? "Disable" : "Enable"}
                </button>
              </div>
            ))}
          </section>
          ) : null}

          {activeSection === "reports" ? (
          <section className="card stack">
            <div className="panelHeader compactPanelHeader">
              <div>
                <h2>Reports</h2>
                <p>Work through safety reports by review status.</p>
              </div>
              <div className="sectionCount">
                {filteredReports.length} of {dashboard.reports.length}
              </div>
            </div>
            <div className="queueToolbar">
              <div className="filterChips" aria-label="Report filters">
                {reportFilters.map((filter) => (
                  <button
                    key={filter.id}
                    className={
                      reportFilter === filter.id ? "filterChip activeFilterChip" : "filterChip"
                    }
                    type="button"
                    onClick={() => setReportFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <input
                className="input queueSearch"
                value={queueSearch}
                onChange={(event) => setQueueSearch(event.target.value)}
                placeholder="Search reports, reasons, targets..."
              />
            </div>
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
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
              <p>No reports match this queue.</p>
            )}
          </section>
          ) : null}

          {activeSection === "disputes" ? (
          <section className="card stack">
            <div className="panelHeader compactPanelHeader">
              <div>
                <h2>Disputes</h2>
                <p>Resolve held-funds outcomes when a booking is contested.</p>
              </div>
              <div className="sectionCount">
                {filteredDisputes.length} of {dashboard.disputes.length}
              </div>
            </div>
            <div className="queueToolbar">
              <div className="filterChips" aria-label="Dispute filters">
                {disputeFilters.map((filter) => (
                  <button
                    key={filter.id}
                    className={
                      disputeFilter === filter.id ? "filterChip activeFilterChip" : "filterChip"
                    }
                    type="button"
                    onClick={() => setDisputeFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <input
                className="input queueSearch"
                value={queueSearch}
                onChange={(event) => setQueueSearch(event.target.value)}
                placeholder="Search disputes, booking IDs, reasons..."
              />
            </div>
            {filteredDisputes.length > 0 ? (
              filteredDisputes.map((dispute) => (
                <div key={dispute.id} className="stack bookingRow">
                  <div className="row">
                    <span>{dispute.booking_id}</span>
                    <span>{dispute.reason}</span>
                    <span>{dispute.status}</span>
                  </div>
                  {dispute.details ? <p>{dispute.details}</p> : null}
                  {dispute.resolution ? <p>Resolution: {dispute.resolution}</p> : null}
                  {dispute.status !== "resolved" ? (
                    <div className="actions">
                      <button
                        className="button"
                        type="button"
                        onClick={() => handleResolveDispute(dispute.id, "release")}
                      >
                        Release funds
                      </button>
                      <button
                        className="button secondaryButton"
                        type="button"
                        onClick={() => handleResolveDispute(dispute.id, "refund")}
                      >
                        Refund buyer
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p>No disputes match this queue.</p>
            )}
          </section>
          ) : null}

          {activeSection === "audit" ? (
          <section className="card stack">
            <h2>Recent audit logs</h2>
            {dashboard.audit_logs.length > 0 ? (
              dashboard.audit_logs.map((auditLog) => (
                <div key={auditLog.id} className="stack bookingRow">
                  <div className="row">
                    <span>{auditLog.action}</span>
                    <span>{auditLog.target_type}</span>
                    <span>{formatDate(auditLog.created_at)}</span>
                  </div>
                  <p>{auditLog.detail}</p>
                  <p>Actor: {auditLog.actor_user_id}</p>
                  <p>Target: {auditLog.target_id}</p>
                </div>
              ))
            ) : (
              <p>No admin actions have been logged yet.</p>
            )}
          </section>
          ) : null}

          {activeSection === "bookings" ? (
          <section className="card stack">
            <div className="panelHeader compactPanelHeader">
              <div>
                <h2>Bookings</h2>
                <p>Monitor booking lifecycle, payment state, and held-funds outcomes.</p>
              </div>
              <div className="sectionCount">
                {filteredBookings.length} of {dashboard.bookings.length}
              </div>
            </div>
            <div className="queueToolbar">
              <div className="filterChips" aria-label="Booking filters">
                {bookingFilters.map((filter) => (
                  <button
                    key={filter.id}
                    className={
                      bookingFilter === filter.id ? "filterChip activeFilterChip" : "filterChip"
                    }
                    type="button"
                    onClick={() => setBookingFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <input
                className="input queueSearch"
                value={queueSearch}
                onChange={(event) => setQueueSearch(event.target.value)}
                placeholder="Search bookings, users, services..."
              />
            </div>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
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
                        <>
                          <button
                            className="button"
                            type="button"
                            onClick={() => handleAcceptBooking(booking.id)}
                          >
                            Accept
                          </button>
                          <button
                            className="button secondaryButton"
                            type="button"
                            onClick={() => handleDeclineBooking(booking.id)}
                          >
                            Decline
                          </button>
                        </>
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
                  {!["cancelled", "declined", "released", "refunded"].includes(booking.status) ? (
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
                      <p>Provider events: {paymentStates[booking.id].webhook_events.length}</p>
                      {paymentStates[booking.id].ledger_entries.map((entry) => (
                        <p key={entry.id}>
                          {entry.entry_type}: {entry.amount} {entry.currency}
                        </p>
                      ))}
                      {paymentStates[booking.id].webhook_events.map((event) => (
                        <p key={event.id}>
                          {event.event_type}: {event.status}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p>No bookings match this queue.</p>
            )}
          </section>
          ) : null}
        </>
      ) : (
        <p>Loading dashboard...</p>
      )}
    </section>
  );
}
