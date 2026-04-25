"use client";

import { useEffect, useState } from "react";

import {
  cancelBooking,
  completeBooking,
  deliverBooking,
  disputeBooking,
  startBooking
} from "@streets/api-client";
import type { AuthSession, Booking } from "@streets/types";
import { bookingNextStep, formatBookingStatus } from "./booking-status";

import { AUTH_SESSION_KEY } from "../lib/auth-session";

type BookingActionsProps = {
  booking: Booking;
};

function readSession(): AuthSession | null {
  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

export function BookingActions({ booking }: BookingActionsProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setSession(readSession());
  }, []);

  const isBuyer = session?.user.id === booking.buyer_id;
  const isCreator = session?.user.id === booking.creator_id;
  const isAdmin = session?.user.role === "admin";
  const isParticipant = Boolean(isBuyer || isCreator || isAdmin);

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    if (!session) {
      setError("Sign in as a booking participant first.");
      return;
    }

    setError("");
    setMessage("");
    setIsBusy(true);
    try {
      await action();
      setMessage(successMessage);
      window.location.reload();
    } catch {
      setError("Could not update this booking from its current state.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDispute(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      setError("Sign in as a booking participant first.");
      return;
    }

    await runAction(
      () => disputeBooking(booking.id, { reason, details }, session.access_token),
      "Dispute opened for admin review."
    );
  }

  const canStart = (isCreator || isAdmin) && booking.status === "accepted";
  const canDeliver =
    (isCreator || isAdmin) && (booking.status === "accepted" || booking.status === "in_progress");
  const canComplete = (isBuyer || isAdmin) && booking.status === "awaiting_release";
  const canCancel =
    isParticipant && !["cancelled", "declined", "released", "refunded"].includes(booking.status);
  const canDispute = [
    "paid_pending_acceptance",
    "accepted",
    "in_progress",
    "awaiting_release",
    "delivered"
  ].includes(booking.status) && isParticipant;

  return (
    <section className="panel">
      <p className="eyebrow">Lifecycle</p>
      <h2>{formatBookingStatus(booking.status)}</h2>
      <p>{bookingNextStep(booking.status)}</p>

      {message ? <p>{message}</p> : null}
      {error ? <p className="errorText">{error}</p> : null}

      <div className="actions">
        {canStart ? (
          <button
            className="button"
            type="button"
            disabled={isBusy}
            onClick={() =>
              runAction(
                () => startBooking(booking.id, session?.access_token ?? ""),
                "Booking marked in progress."
              )
            }
          >
            Mark in progress
          </button>
        ) : null}
        {canDeliver ? (
          <button
            className="button"
            type="button"
            disabled={isBusy}
            onClick={() =>
              runAction(
                () => deliverBooking(booking.id, session?.access_token ?? ""),
                "Booking marked delivered."
              )
            }
          >
            Mark delivered
          </button>
        ) : null}
        {canComplete ? (
          <button
            className="button"
            type="button"
            disabled={isBusy}
            onClick={() =>
              runAction(
                () => completeBooking(booking.id, session?.access_token ?? ""),
                "Completion confirmed."
              )
            }
          >
            Confirm completion
          </button>
        ) : null}
        {canCancel ? (
          <button
            className="button secondaryButton"
            type="button"
            disabled={isBusy}
            onClick={() =>
              runAction(
                () => cancelBooking(booking.id, session?.access_token ?? ""),
                "Booking cancelled."
              )
            }
          >
            Cancel booking
          </button>
        ) : null}
      </div>

      {!session ? (
        <article className="checkoutNotice">
          <strong>Sign in to act on this booking</strong>
          <span>Only the buyer, creator, or admin can update this booking.</span>
        </article>
      ) : null}

      {canDispute ? (
        <form className="stack formShell" onSubmit={handleDispute}>
          <h3>Open a dispute</h3>
          <input
            className="input"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason"
          />
          <textarea
            className="input textarea"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Optional details"
          />
          <button className="button secondaryButton" type="submit" disabled={!reason.trim()}>
            Send to admin review
          </button>
        </form>
      ) : null}
    </section>
  );
}
