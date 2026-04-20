import { notFound } from "next/navigation";

import { getBooking, listBookingEvents } from "@streets/api-client";
import { bookingNextStep, formatBookingStatus } from "../../../components/booking-status";
import { BookingWorkspace } from "../../../components/booking-workspace";
import { StatusPill } from "../../../components/status-pill";
import { WorkflowStepper } from "../../../components/workflow-stepper";

type BookingDetailPageProps = {
  params: Promise<{ bookingId: string }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { bookingId } = await params;
  const [booking, events] = await Promise.all([
    getBooking(bookingId).catch(() => null),
    listBookingEvents(bookingId).catch(() => [])
  ]);

  if (!booking) {
    notFound();
  }

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Booking</p>
        <StatusPill status={booking.status} />
        <h1>{formatBookingStatus(booking.status)}</h1>
        <p>{bookingNextStep(booking.status)}</p>
        <p className="note">Booking ID: {booking.id}</p>
        <div className="stats">
          <article className="stat">
            <strong>{booking.fulfillment_type.replace("_", " ")}</strong>
            <span>Fulfillment</span>
          </article>
          <article className="stat">
            <strong>{formatDate(booking.scheduled_start)}</strong>
            <span>Start</span>
          </article>
          <article className="stat">
            <strong>{formatDate(booking.release_at)}</strong>
            <span>Release target</span>
          </article>
        </div>
      </section>
      <section className="panel">
        <p className="eyebrow">Flow</p>
        <h2>How this booking moves</h2>
        <WorkflowStepper status={booking.status} />
      </section>
      <BookingWorkspace booking={booking} events={events} />
    </main>
  );
}
