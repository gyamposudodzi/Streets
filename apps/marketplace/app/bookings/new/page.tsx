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
        <p className="eyebrow">Booking</p>
        <h1>Create booking draft</h1>
        <p>
          This Phase 1 flow creates a booking directly against the backend API using the
          active buyer session stored from the auth page.
        </p>
        <div className="grid">
          <article className="card">
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <p>
              {service.fulfillment_type.replace("_", " ")} - {service.duration_minutes} min
            </p>
          </article>
          <article className="card">
            <h3>Selected slot</h3>
            <p>{selectedSlot ? selectedSlot.starts_at : "No fixed slot selected"}</p>
            <p>{selectedSlot ? selectedSlot.ends_at : "Creator can follow up later"}</p>
          </article>
        </div>
        <div className="formShell">
          <BookingForm serviceId={service.id} slotId={selectedSlot?.id} />
        </div>
      </section>
    </main>
  );
}
