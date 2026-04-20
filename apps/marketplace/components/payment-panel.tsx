"use client";

import { useEffect, useState } from "react";

import {
  createPaymentIntent,
  getBookingPaymentState,
  simulatePaymentSuccess
} from "@streets/api-client";
import type { AuthSession, BookingPaymentState, Payment } from "@streets/types";
import { formatBookingStatus } from "./booking-status";

const sessionStorageKey = "streets.session";

type PaymentPanelProps = {
  bookingId: string;
  bookingStatus: string;
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}

function readSession(): AuthSession | null {
  const raw = window.localStorage.getItem(sessionStorageKey);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

export function PaymentPanel({ bookingId, bookingStatus }: PaymentPanelProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [paymentState, setPaymentState] = useState<BookingPaymentState | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function loadPaymentState() {
    try {
      const state = await getBookingPaymentState(bookingId);
      setPaymentState(state);
    } catch {
      setError("Could not load payment state.");
    }
  }

  useEffect(() => {
    setSession(readSession());
    loadPaymentState();
  }, [bookingId]);

  async function handleCreateIntent() {
    if (!session) {
      setError("Sign in as the buyer before creating a payment intent.");
      return;
    }

    setError("");
    setMessage("");
    setIsBusy(true);
    try {
      const intent = await createPaymentIntent(bookingId, session.access_token);
      setMessage(`Payment intent created: ${intent.checkout_reference}`);
      await loadPaymentState();
    } catch {
      setError("Could not create payment intent for this booking.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSimulateSuccess(payment: Payment) {
    if (!session) {
      setError("Sign in as the buyer before completing payment.");
      return;
    }

    setError("");
    setMessage("");
    setIsBusy(true);
    try {
      await simulatePaymentSuccess(payment.id, session.access_token);
      setMessage("Payment succeeded. Funds are now held pending release rules.");
      await loadPaymentState();
    } catch {
      setError("Could not simulate payment success.");
    } finally {
      setIsBusy(false);
    }
  }

  const pendingPayment = paymentState?.payments.find(
    (payment) => payment.status === "requires_action"
  );

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Payment</p>
          <h2>Upfront payment and held funds</h2>
          <p>
            Current stage: {formatBookingStatus(bookingStatus)}. Buyer pays first;
            creator funds stay held until release or refund.
          </p>
        </div>
        {bookingStatus === "pending_payment" && !pendingPayment ? (
          <button className="button" type="button" onClick={handleCreateIntent} disabled={isBusy}>
            Create payment intent
          </button>
        ) : null}
      </div>

      {message ? <p>{message}</p> : null}
      {error ? <p className="errorText">{error}</p> : null}

      <div className="grid">
        {paymentState?.payments.length ? (
          paymentState.payments.map((payment) => (
            <article key={payment.id} className="card">
              <p className="badge">{payment.status}</p>
              <h3>{formatMoney(payment.gross_amount, payment.currency)}</h3>
              <p>Provider: {payment.provider}</p>
              <p>Platform fee: {formatMoney(payment.platform_fee, payment.currency)}</p>
              <p>Creator amount: {formatMoney(payment.creator_amount, payment.currency)}</p>
              {payment.status === "requires_action" ? (
                <button
                  className="button"
                  type="button"
                  onClick={() => handleSimulateSuccess(payment)}
                  disabled={isBusy}
                >
                  Simulate success
                </button>
              ) : null}
            </article>
          ))
        ) : (
          <article className="card">
            <h3>No payment yet</h3>
            <p>Create a simulated intent to represent buyer checkout in development.</p>
          </article>
        )}
      </div>

      <div className="grid">
        <article className="card">
          <h3>Held funds</h3>
          {paymentState?.held_funds.length ? (
            paymentState.held_funds.map((held) => (
              <p key={held.id}>
                {formatMoney(held.amount, held.currency)} - {held.status}
              </p>
            ))
          ) : (
            <p>No held funds yet.</p>
          )}
        </article>

        <article className="card">
          <h3>Ledger</h3>
          {paymentState?.ledger_entries.length ? (
            paymentState.ledger_entries.map((entry) => (
              <p key={entry.id}>
                {entry.entry_type}: {formatMoney(entry.amount, entry.currency)}
              </p>
            ))
          ) : (
            <p>No ledger entries yet.</p>
          )}
        </article>

        <article className="card">
          <h3>Provider events</h3>
          <p className="note">Technical event trail for payment adapters.</p>
          {paymentState?.webhook_events.length ? (
            paymentState.webhook_events.map((event) => (
              <p key={event.id}>
                {event.event_type}: {event.status}
              </p>
            ))
          ) : (
            <p>No provider events yet.</p>
          )}
        </article>
      </div>
    </section>
  );
}
