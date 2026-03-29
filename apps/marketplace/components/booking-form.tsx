"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createBooking } from "@streets/api-client";

type BookingFormProps = {
  serviceId: string;
  slotId?: string;
};

export function BookingForm({ serviceId, slotId }: BookingFormProps) {
  const router = useRouter();
  const [buyerId, setBuyerId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const booking = await createBooking({
        buyer_id: buyerId.trim(),
        service_id: serviceId,
        slot_id: slotId
      });
      router.push(`/bookings/${booking.id}`);
    } catch {
      setError("Booking creation failed. Double-check the buyer ID and backend availability.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <label className="stack">
        <span>Buyer ID</span>
        <input
          className="input"
          value={buyerId}
          onChange={(event) => setBuyerId(event.target.value)}
          placeholder="Paste a registered buyer user ID"
          required
        />
      </label>
      <label className="stack">
        <span>Service ID</span>
        <input className="input" value={serviceId} readOnly />
      </label>
      <label className="stack">
        <span>Slot ID</span>
        <input className="input" value={slotId ?? "Flexible booking"} readOnly />
      </label>
      {error ? <p className="errorText">{error}</p> : null}
      <button className="button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create booking"}
      </button>
    </form>
  );
}
