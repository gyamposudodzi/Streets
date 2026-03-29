import Link from "next/link";
import { notFound } from "next/navigation";

import { getService, listServiceSlots } from "@streets/api-client";

type ServiceDetailPageProps = {
  params: Promise<{ serviceId: string }>;
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { serviceId } = await params;
  const service = await getService(serviceId).catch(() => null);

  if (!service) {
    notFound();
  }

  const slots = await listServiceSlots(serviceId).catch(() => []);

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Service</p>
        <h1>{service.title}</h1>
        <p>{service.description}</p>
        <div className="stats">
          <article className="stat">
            <strong>{formatPrice(service.price, service.currency)}</strong>
            <span>Price</span>
          </article>
          <article className="stat">
            <strong>{service.duration_minutes} min</strong>
            <span>Duration</span>
          </article>
          <article className="stat">
            <strong>{service.fulfillment_type.replace("_", " ")}</strong>
            <span>Fulfillment</span>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Availability</p>
            <h2>Choose a slot or continue without one</h2>
          </div>
          <Link href={`/bookings/new?service=${service.id}`} className="buttonLink">
            Start booking
          </Link>
        </div>
        <div className="grid">
          {slots.length > 0 ? (
            slots.map((slot) => (
              <article key={slot.id} className="card">
                <h3>{formatDate(slot.starts_at)}</h3>
                <p>Ends {formatDate(slot.ends_at)}</p>
                <p>{slot.is_reserved ? "Reserved" : "Available"}</p>
                {!slot.is_reserved ? (
                  <Link
                    href={`/bookings/new?service=${service.id}&slot=${slot.id}`}
                    className="inlineLink"
                  >
                    Book this slot
                  </Link>
                ) : null}
              </article>
            ))
          ) : (
            <article className="card">
              <h3>No slots published</h3>
              <p>
                This service can still be booked if the creator uses a flexible or
                non-calendar fulfillment flow.
              </p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
