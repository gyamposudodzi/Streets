import { notFound } from "next/navigation";

import { getService, listServiceSlots } from "@streets/api-client";

import { BookingForm } from "../../../components/booking-form";

type NewBookingPageProps = {
  searchParams: Promise<{
    service?: string;
    slot?: string;
  }>;
};

export default async function NewBookingPage({ searchParams }: NewBookingPageProps) {
  const params = await searchParams;
  const serviceId = params.service;

  if (!serviceId) {
    notFound();
  }

  const [service, slots] = await Promise.all([
    getService(serviceId).catch(() => null),
    listServiceSlots(serviceId).catch(() => [])
  ]);

  if (!service) {
    notFound();
  }

  const selectedSlot = params.slot
    ? slots.find((slot) => slot.id === params.slot && !slot.is_reserved)
    : undefined;

  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Checkout</p>
        <h1>Review your booking</h1>
        <p className="note">
          You will create the booking first, then pay upfront on the booking page.
          Once payment succeeds, the creator can accept or decline. Declines refund the buyer.
        </p>
        <div className="grid">
          <article className="card">
            <p className="badge">{service.fulfillment_type.replace("_", " ")}</p>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <p>
              {service.fulfillment_type.replace("_", " ")} - {service.duration_minutes} min
            </p>
            <p>{new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: service.currency
            }).format(service.price / 100)}</p>
          </article>
          <article className="card">
            <h3>Selected slot</h3>
            <p>{selectedSlot ? selectedSlot.starts_at : "No fixed slot selected"}</p>
            <p>{selectedSlot ? selectedSlot.ends_at : "Creator can follow up later"}</p>
          </article>
          <article className="card">
            <h3>What happens next</h3>
            <p>1. Create booking.</p>
            <p>2. Pay upfront.</p>
            <p>3. Creator accepts or declines.</p>
            <p>4. Held funds are released or refunded by platform rules.</p>
          </article>
        </div>
        <div className="formShell">
          <BookingForm serviceId={service.id} slotId={selectedSlot?.id} />
        </div>
      </section>
    </main>
  );
}
