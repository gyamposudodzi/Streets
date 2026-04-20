import { notFound } from "next/navigation";

import { getBooking, listBookingEvents } from "@streets/api-client";
import { BookingActions } from "../../../components/booking-actions";
import { BookingChat } from "../../../components/booking-chat";
import { bookingNextStep, formatBookingStatus } from "../../../components/booking-status";
import { PaymentPanel } from "../../../components/payment-panel";

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
        <div className="flowSteps">
          <article className={booking.status === "pending_payment" ? "flowStep activeStep" : "flowStep"}>
            <strong>1. Buyer pays</strong>
            <span>Funds are held after payment succeeds.</span>
          </article>
          <article className={booking.status === "paid_pending_acceptance" ? "flowStep activeStep" : "flowStep"}>
            <strong>2. Creator decides</strong>
            <span>Creator accepts or declines the booking.</span>
          </article>
          <article className={["accepted", "in_progress", "awaiting_release"].includes(booking.status) ? "flowStep activeStep" : "flowStep"}>
            <strong>3. Service happens</strong>
            <span>Creator starts, delivers, and buyer can confirm.</span>
          </article>
          <article className={["delivered", "released", "refunded", "disputed"].includes(booking.status) ? "flowStep activeStep" : "flowStep"}>
            <strong>4. Release or refund</strong>
            <span>Admin handles held-funds release, refund, or dispute review.</span>
          </article>
        </div>
      </section>
      <PaymentPanel bookingId={booking.id} bookingStatus={booking.status} />
      <BookingActions booking={booking} />
      <BookingChat bookingId={booking.id} />
      <section className="panel">
        <p className="eyebrow">Timeline</p>
        <h2>Booking events</h2>
        <div className="stack">
          {events.length > 0 ? (
            events.map((event) => (
              <article key={event.id} className="card">
                <h3>{event.event_type}</h3>
                <p>{event.detail}</p>
                <p>{formatDate(event.created_at)}</p>
              </article>
            ))
          ) : (
            <article className="card">
              <h3>No events found</h3>
              <p>This booking has not emitted any visible events yet.</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
