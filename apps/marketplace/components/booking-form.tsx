"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createBooking } from "@streets/api-client";
import type { AuthSession } from "@streets/types";

type BookingFormProps = {
  serviceId: string;
  slotId?: string;
};

const sessionStorageKey = "streets.session";

export function BookingForm({ serviceId, slotId }: BookingFormProps) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(sessionStorageKey);
    setSession(raw ? (JSON.parse(raw) as AuthSession) : null);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!session) {
      setError("Sign in first to create a booking.");
      return;
    }
    setIsSubmitting(true);

    try {
      const booking = await createBooking({
        service_id: serviceId,
        slot_id: slotId
      }, session.access_token);
      router.push(`/bookings/${booking.id}`);
    } catch {
      setError("Booking creation failed. Check your session and backend availability.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <label className="stack">
        <span>Signed in buyer</span>
        <input
          className="input"
          value={session ? `${session.user.email} (${session.user.id})` : "No active session"}
          readOnly
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
      {!session ? (
        <p className="errorText">
          No buyer session found. <Link href="/auth">Register or sign in here.</Link>
        </p>
      ) : null}
      {error ? <p className="errorText">{error}</p> : null}
      <button className="button" type="submit" disabled={isSubmitting || !session}>
        {isSubmitting ? "Creating..." : "Create booking"}
      </button>
    </form>
  );
}
