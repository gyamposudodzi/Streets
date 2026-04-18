"use client";

import { useEffect, useState } from "react";

import { createBookingMessage, createReport, listBookingMessages } from "@streets/api-client";
import type { AuthSession, BookingMessage } from "@streets/types";

const sessionStorageKey = "streets.session";

type BookingChatProps = {
  bookingId: string;
};

function readSession(): AuthSession | null {
  const raw = window.localStorage.getItem(sessionStorageKey);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function BookingChat({ bookingId }: BookingChatProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [body, setBody] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function loadMessages(accessToken: string) {
    try {
      const nextMessages = await listBookingMessages(bookingId, accessToken);
      setMessages(nextMessages);
    } catch {
      setError("Could not load booking messages.");
    }
  }

  useEffect(() => {
    const nextSession = readSession();
    setSession(nextSession);
    if (nextSession) {
      loadMessages(nextSession.access_token);
    }
  }, [bookingId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      setError("Sign in as a booking participant to send messages.");
      return;
    }

    setError("");
    setIsBusy(true);
    try {
      await createBookingMessage(bookingId, body, session.access_token);
      setBody("");
      setMessage("Message sent.");
      await loadMessages(session.access_token);
    } catch {
      setError("Could not send message.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReportSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      setError("Sign in as a booking participant to submit a report.");
      return;
    }

    setError("");
    setMessage("");
    try {
      await createReport(
        {
          target_type: "booking",
          target_id: bookingId,
          reason: reportReason,
          details: reportDetails
        },
        session.access_token
      );
      setReportReason("");
      setReportDetails("");
      setMessage("Report submitted for admin review.");
    } catch {
      setError("Could not submit report.");
    }
  }

  return (
    <section className="panel">
      <p className="eyebrow">Messages</p>
      <h2>Booking chat</h2>
      {message ? <p>{message}</p> : null}
      {error ? <p className="errorText">{error}</p> : null}
      <div className="stack">
        {messages.length > 0 ? (
          messages.map((message) => (
            <article key={message.id} className="card">
              <p>{message.body}</p>
              <p>
                Sender {message.sender_id} - {formatDate(message.created_at)}
              </p>
            </article>
          ))
        ) : (
          <article className="card">
            <h3>No messages yet</h3>
            <p>Use this thread for booking-scoped coordination.</p>
          </article>
        )}
      </div>
      <form className="stack formShell" onSubmit={handleSubmit}>
        <textarea
          className="input textarea"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a booking message"
        />
        <button className="button" type="submit" disabled={isBusy || !body.trim()}>
          {isBusy ? "Sending..." : "Send message"}
        </button>
      </form>
      <form className="stack formShell" onSubmit={handleReportSubmit}>
        <h3>Report this booking</h3>
        <input
          className="input"
          value={reportReason}
          onChange={(event) => setReportReason(event.target.value)}
          placeholder="Reason"
        />
        <textarea
          className="input textarea"
          value={reportDetails}
          onChange={(event) => setReportDetails(event.target.value)}
          placeholder="Optional details"
        />
        <button className="button secondaryButton" type="submit" disabled={!reportReason.trim()}>
          Submit report
        </button>
      </form>
    </section>
  );
}
