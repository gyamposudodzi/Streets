import { notFound } from "next/navigation";

import { getBooking, listBookingEvents } from "@streets/api-client";

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
        <h1>{booking.id}</h1>
        <p>
          Current status: <strong>{booking.status}</strong>
        </p>
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
