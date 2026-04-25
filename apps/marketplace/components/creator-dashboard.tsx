"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  acceptBooking,
  cancelBooking,
  createCreatorService,
  createServiceSlot,
  declineBooking,
  deliverBooking,
  getCreator,
  getBookingPaymentState,
  listCreatorBookings,
  listServices,
  startBooking,
  updateCreatorService,
  upsertCreatorProfile
} from "@streets/api-client";
import type { AuthSession, Booking, BookingPaymentState, BookingStatus, Service } from "@streets/types";
import { AUTH_SESSION_KEY } from "../lib/auth-session";
import { formatBookingStatus } from "./booking-status";

const emptyProfile = {
  display_name: "",
  bio: "",
  country: "",
  service_region: ""
};

const emptyService = {
  title: "",
  description: "",
  category: "",
  duration_minutes: 30,
  price: 10000,
  currency: "USD",
  fulfillment_type: "video"
};

type CreatorSection = "profile" | "services" | "availability" | "bookings";
type BookingFilter = "action_needed" | "active" | "completed" | "all";

const creatorSections: Array<{ id: CreatorSection; label: string; helper: string }> = [
  {
    id: "profile",
    label: "Profile",
    helper: "Public identity and service region"
  },
  {
    id: "services",
    label: "Services",
    helper: "Create and manage bookable offers"
  },
  {
    id: "availability",
    label: "Availability",
    helper: "Publish time slots for booking"
  },
  {
    id: "bookings",
    label: "Bookings",
    helper: "Accept, decline, or cancel requests"
  }
];

const bookingFilters: Array<{ id: BookingFilter; label: string }> = [
  {
    id: "action_needed",
    label: "Action needed"
  },
  {
    id: "active",
    label: "Active"
  },
  {
    id: "completed",
    label: "Completed"
  },
  {
    id: "all",
    label: "All"
  }
];

function formatDateTime(value: string | null) {
  if (!value) {
    return "Flexible schedule";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function bookingMatchesFilter(status: BookingStatus, filter: BookingFilter) {
  if (filter === "action_needed") {
    return status === "paid_pending_acceptance";
  }

  if (filter === "active") {
    return ["accepted", "in_progress", "delivered", "awaiting_release", "disputed"].includes(status);
  }

  if (filter === "completed") {
    return ["released", "refunded", "declined", "cancelled"].includes(status);
  }

  return true;
}

export function CreatorDashboard() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [paymentStates, setPaymentStates] = useState<Record<string, BookingPaymentState>>({});
  const [slotServiceId, setSlotServiceId] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<CreatorSection>("profile");
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>("action_needed");

  const servicesById = new Map(services.map((service) => [service.id, service]));
  const filteredBookings = bookings.filter((booking) =>
    bookingMatchesFilter(booking.status, bookingFilter)
  );

  useEffect(() => {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as AuthSession) : null;
    setSession(parsed);
  }, []);

  useEffect(() => {
    const currentSession = session;
    if (
      !currentSession ||
      (currentSession.user.role !== "creator" && currentSession.user.role !== "admin")
    ) {
      return;
    }
    const creatorId = currentSession.user.id;
    const accessToken = currentSession.access_token;

    async function loadDashboard() {
      setError("");
      try {
        const [creatorProfile, creatorServices] = await Promise.all([
          getCreator(creatorId).catch(() => null),
          listServices({ creator_id: creatorId })
        ]);
        const creatorBookings = await listCreatorBookings(
          creatorId,
          accessToken
        ).catch(() => []);

        if (creatorProfile) {
          setProfile({
            display_name: creatorProfile.display_name,
            bio: creatorProfile.bio,
            country: creatorProfile.country,
            service_region: creatorProfile.service_region
          });
        }

        setServices(creatorServices);
        setBookings(creatorBookings);
        if (creatorServices.length > 0 && !slotServiceId) {
          setSlotServiceId(creatorServices[0].id);
        }
      } catch {
        setError("Could not load creator dashboard data.");
      }
    }

    loadDashboard();
  }, [session, slotServiceId]);

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const saved = await upsertCreatorProfile(session.user.id, profile, session.access_token);
      setProfile({
        display_name: saved.display_name,
        bio: saved.bio,
        country: saved.country,
        service_region: saved.service_region
      });
      setMessage("Profile saved.");
    } catch {
      setError("Profile update failed.");
    }
  }

  async function handleServiceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const created = await createCreatorService(
        session.user.id,
        {
          ...serviceForm,
          duration_minutes: Number(serviceForm.duration_minutes),
          price: Number(serviceForm.price)
        },
        session.access_token
      );
      setServices((current) => [created, ...current]);
      setSlotServiceId(created.id);
      setServiceForm(emptyService);
      setMessage("Service created.");
    } catch {
      setError("Service creation failed.");
    }
  }

  async function handleToggleService(service: Service) {
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const updated = await updateCreatorService(
        session.user.id,
        service.id,
        { is_active: !service.is_active },
        session.access_token
      );
      setServices((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry))
      );
      setMessage(`Service ${updated.is_active ? "activated" : "deactivated"}.`);
    } catch {
      setError("Service status update failed.");
    }
  }

  async function handleSlotSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !slotServiceId) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await createServiceSlot(
        session.user.id,
        slotServiceId,
        {
          starts_at: new Date(slotStart).toISOString(),
          ends_at: new Date(slotEnd).toISOString()
        },
        session.access_token
      );
      setSlotStart("");
      setSlotEnd("");
      setMessage("Availability slot published.");
    } catch {
      setError("Slot publishing failed.");
    }
  }

  async function handleAcceptBooking(bookingId: string) {
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const updated = await acceptBooking(bookingId, session.access_token);
      setBookings((current) =>
        current.map((booking) => (booking.id === updated.id ? updated : booking))
      );
      setMessage("Booking accepted.");
    } catch {
      setError("Booking acceptance failed.");
    }
  }

  async function handleDeclineBooking(bookingId: string) {
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const updated = await declineBooking(bookingId, session.access_token);
      setBookings((current) =>
        current.map((booking) => (booking.id === updated.id ? updated : booking))
      );
      setMessage("Booking declined and buyer funds refunded.");
    } catch {
      setError("Booking decline failed.");
    }
  }

  async function handleCancelBooking(bookingId: string) {
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const updated = await cancelBooking(bookingId, session.access_token);
      setBookings((current) =>
        current.map((booking) => (booking.id === updated.id ? updated : booking))
      );
      setMessage("Booking cancelled.");
    } catch {
      setError("Booking cancellation failed.");
    }
  }

  async function handleStartBooking(bookingId: string) {
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const updated = await startBooking(bookingId, session.access_token);
      setBookings((current) =>
        current.map((booking) => (booking.id === updated.id ? updated : booking))
      );
      setMessage("Booking marked in progress.");
    } catch {
      setError("Could not start this booking. Confirm it has been accepted first.");
    }
  }

  async function handleDeliverBooking(bookingId: string) {
    if (!session) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const updated = await deliverBooking(bookingId, session.access_token);
      setBookings((current) =>
        current.map((booking) => (booking.id === updated.id ? updated : booking))
      );
      setMessage("Booking marked delivered and moved into release review.");
    } catch {
      setError("Could not mark this booking delivered.");
    }
  }

  async function handleLoadPaymentState(bookingId: string) {
    setError("");
    try {
      const state = await getBookingPaymentState(bookingId);
      setPaymentStates((current) => ({ ...current, [bookingId]: state }));
    } catch {
      setError("Could not load payment state for this booking.");
    }
  }

  if (!session) {
    return (
      <section className="panel">
        <p className="eyebrow">Creator</p>
        <h1>Creator dashboard</h1>
        <p>
          Sign in with a creator account first. You can create one from the auth page.
        </p>
        <Link href="/auth" className="buttonLink">
          Go to auth
        </Link>
      </section>
    );
  }

  if (session.user.role !== "creator" && session.user.role !== "admin") {
    return (
      <section className="panel">
        <p className="eyebrow">Creator</p>
        <h1>Creator dashboard</h1>
        <p>
          The current session is a buyer account. Sign out and create a creator session to
          manage listings.
        </p>
        <Link href="/auth" className="buttonLink">
          Switch account
        </Link>
      </section>
    );
  }

  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Creator</p>
        <h1>Creator control center</h1>
        <p>
          Signed in as {session.user.email}. Publish services, manage availability,
          and choose which paid bookings you want to accept.
        </p>
      </div>

      {message ? <p>{message}</p> : null}
      {error ? <p className="errorText">{error}</p> : null}

      <nav className="workspaceSubnav" aria-label="Creator dashboard sections">
        {creatorSections.map((section) => (
          <button
            key={section.id}
            className={
              activeSection === section.id
                ? "workspaceSubnavButton activeWorkspaceSubnavButton"
                : "workspaceSubnavButton"
            }
            type="button"
            onClick={() => setActiveSection(section.id)}
          >
            <span>{section.label}</span>
            <small>{section.helper}</small>
          </button>
        ))}
      </nav>

      {activeSection === "profile" ? (
        <form className="card stack" onSubmit={handleProfileSubmit}>
          <h3>Profile</h3>
          <input
            className="input"
            placeholder="Display name"
            value={profile.display_name}
            onChange={(event) => setProfile({ ...profile, display_name: event.target.value })}
          />
          <textarea
            className="input textarea"
            placeholder="Bio"
            value={profile.bio}
            onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
          />
          <div className="twoCol">
            <input
              className="input"
              placeholder="Country"
              value={profile.country}
              onChange={(event) => setProfile({ ...profile, country: event.target.value })}
            />
            <input
              className="input"
              placeholder="Service region"
              value={profile.service_region}
              onChange={(event) => setProfile({ ...profile, service_region: event.target.value })}
            />
          </div>
          <button className="button" type="submit">
            Save profile
          </button>
        </form>
      ) : null}

      {activeSection === "services" ? (
        <>
          <form className="card stack" onSubmit={handleServiceSubmit}>
            <h3>Create service</h3>
            <input
              className="input"
              placeholder="Title"
              value={serviceForm.title}
              onChange={(event) => setServiceForm({ ...serviceForm, title: event.target.value })}
            />
            <textarea
              className="input textarea"
              placeholder="Description"
              value={serviceForm.description}
              onChange={(event) =>
                setServiceForm({ ...serviceForm, description: event.target.value })
              }
            />
            <div className="twoCol">
              <input
                className="input"
                placeholder="Category"
                value={serviceForm.category}
                onChange={(event) =>
                  setServiceForm({ ...serviceForm, category: event.target.value })
                }
              />
              <select
                className="input"
                value={serviceForm.fulfillment_type}
                onChange={(event) =>
                  setServiceForm({ ...serviceForm, fulfillment_type: event.target.value })
                }
              >
                <option value="video">Video</option>
                <option value="audio_call">Audio call</option>
                <option value="chat">Chat</option>
                <option value="custom_request">Custom request</option>
                <option value="in_person">In person</option>
              </select>
            </div>
            <div className="twoCol">
              <input
                className="input"
                type="number"
                min="1"
                value={serviceForm.duration_minutes}
                onChange={(event) =>
                  setServiceForm({ ...serviceForm, duration_minutes: Number(event.target.value) })
                }
              />
              <input
                className="input"
                type="number"
                min="100"
                step="100"
                value={serviceForm.price}
                onChange={(event) =>
                  setServiceForm({ ...serviceForm, price: Number(event.target.value) })
                }
              />
            </div>
            <button className="button" type="submit">
              Create service
            </button>
          </form>

          <div className="grid">
            {services.map((service) => (
              <article key={service.id} className="card">
                <p className="badge">{service.fulfillment_type.replace("_", " ")}</p>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <p>
                  {service.category} - {service.duration_minutes} min
                </p>
                <p>{service.price} cents</p>
                <p>{service.is_active ? "Active" : "Inactive"}</p>
                <p>
                  Listing: {service.moderation_status === "approved" ? "Public" : "Held for review"}
                </p>
                {service.compliance_score > 0 ? (
                  <p>Admin note: {service.compliance_notes}</p>
                ) : null}
                <button
                  className="button secondaryButton"
                  type="button"
                  onClick={() => handleToggleService(service)}
                >
                  {service.is_active ? "Deactivate" : "Activate"}
                </button>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {activeSection === "availability" ? (
        <form className="card stack" onSubmit={handleSlotSubmit}>
          <h3>Publish slot</h3>
          <select
            className="input"
            value={slotServiceId}
            onChange={(event) => setSlotServiceId(event.target.value)}
          >
            <option value="">Select service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title}
              </option>
            ))}
          </select>
          <div className="twoCol">
            <input
              className="input"
              type="datetime-local"
              value={slotStart}
              onChange={(event) => setSlotStart(event.target.value)}
            />
            <input
              className="input"
              type="datetime-local"
              value={slotEnd}
              onChange={(event) => setSlotEnd(event.target.value)}
            />
          </div>
          <button
            className="button"
            type="submit"
            disabled={!slotServiceId || !slotStart || !slotEnd}
          >
            Publish slot
          </button>
        </form>
      ) : null}

      {activeSection === "bookings" ? (
        <section className="card stack">
          <div className="panelHeader">
            <div>
              <h3>Booking requests</h3>
              <p className="note">
                Paid bookings wait for your decision. Accept to start fulfillment,
                deliver when finished, or decline to refund the buyer automatically.
              </p>
            </div>
            <p className="badge">{bookings.length} total</p>
          </div>
          <div className="segmentedControl" role="tablist" aria-label="Booking filters">
            {bookingFilters.map((filter) => (
              <button
                key={filter.id}
                className={
                  bookingFilter === filter.id ? "segmentButton activeSegmentButton" : "segmentButton"
                }
                type="button"
                onClick={() => setBookingFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => {
              const service = servicesById.get(booking.service_id);
              const paymentState = paymentStates[booking.id];

              return (
                <article key={booking.id} className="card stack bookingCard">
                  <div className="bookingCardHeader">
                    <div>
                      <p className="badge">{booking.fulfillment_type.replace("_", " ")}</p>
                      <h3>{service?.title ?? "Booked service"}</h3>
                      <p className="note">{booking.id}</p>
                    </div>
                    <p className="statusPill">{formatBookingStatus(booking.status)}</p>
                  </div>
                  <div className="bookingMetaGrid">
                    <span>Buyer: {booking.buyer_id}</span>
                    <span>Starts: {formatDateTime(booking.scheduled_start)}</span>
                    <span>Ends: {formatDateTime(booking.scheduled_end)}</span>
                    <span>
                      Release: {booking.release_at ? formatDateTime(booking.release_at) : "Not scheduled"}
                    </span>
                  </div>
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
                    {booking.status === "accepted" ? (
                      <button
                        className="button"
                        type="button"
                        onClick={() => handleStartBooking(booking.id)}
                      >
                        Start service
                      </button>
                    ) : null}
                    {["accepted", "in_progress"].includes(booking.status) ? (
                      <button
                        className="button"
                        type="button"
                        onClick={() => handleDeliverBooking(booking.id)}
                      >
                        Mark delivered
                      </button>
                    ) : null}
                    <button
                      className="button secondaryButton"
                      type="button"
                      onClick={() => handleLoadPaymentState(booking.id)}
                    >
                      Load payment state
                    </button>
                    {!["cancelled", "declined", "released", "refunded"].includes(booking.status) ? (
                      <button
                        className="button secondaryButton"
                        type="button"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                  {paymentState ? (
                    <div className="checkoutNotice">
                      <strong>Payment state</strong>
                      <span>Payments: {paymentState.payments.length}</span>
                      <span>Held funds: {paymentState.held_funds.length}</span>
                      <span>Ledger entries: {paymentState.ledger_entries.length}</span>
                      {paymentState.held_funds.map((heldFund) => (
                        <span key={heldFund.id}>
                          {heldFund.status}: {heldFund.amount} {heldFund.currency}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <p>No bookings in this view.</p>
          )}
        </section>
      ) : null}
    </section>
  );
}
