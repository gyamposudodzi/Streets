"use client";

import { useState } from "react";

import type { Booking, BookingEvent } from "@streets/types";
import { BookingActions } from "./booking-actions";
import { BookingChat } from "./booking-chat";
import { PaymentPanel } from "./payment-panel";
import { TimelineEventCard } from "./timeline-event-card";

type BookingWorkspaceProps = {
  booking: Booking;
  events: BookingEvent[];
};

type BookingWorkspaceSection = "payment" | "actions" | "chat" | "timeline";

const bookingWorkspaceSections: Array<{
  id: BookingWorkspaceSection;
  label: string;
  helper: string;
}> = [
  {
    id: "payment",
    label: "Payment",
    helper: "Checkout, held funds, ledger, and provider events"
  },
  {
    id: "actions",
    label: "Actions",
    helper: "Confirm, dispute, cancel, or update lifecycle"
  },
  {
    id: "chat",
    label: "Chat",
    helper: "Booking-scoped messages and reports"
  },
  {
    id: "timeline",
    label: "Timeline",
    helper: "Immutable booking event history"
  }
];

export function BookingWorkspace({ booking, events }: BookingWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<BookingWorkspaceSection>("payment");

  return (
    <section className="panel stack">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2>Booking control room</h2>
          <p className="note">
            Follow payment, delivery, messaging, and event history from one focused place.
          </p>
        </div>
      </div>

      <nav className="workspaceSubnav" aria-label="Booking workspace sections">
        {bookingWorkspaceSections.map((section) => (
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

      {activeSection === "payment" ? (
        <PaymentPanel bookingId={booking.id} bookingStatus={booking.status} />
      ) : null}

      {activeSection === "actions" ? <BookingActions booking={booking} /> : null}

      {activeSection === "chat" ? <BookingChat bookingId={booking.id} /> : null}

      {activeSection === "timeline" ? (
        <section className="panel">
          <p className="eyebrow">Timeline</p>
          <h2>Booking events</h2>
          <div className="stack">
            {events.length > 0 ? (
              events.map((event) => <TimelineEventCard key={event.id} event={event} />)
            ) : (
              <article className="card">
                <h3>No events found</h3>
                <p>This booking has not emitted any visible events yet.</p>
              </article>
            )}
          </div>
        </section>
      ) : null}
    </section>
  );
}
