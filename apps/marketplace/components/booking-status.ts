import type { BookingStatus } from "@streets/types";

export function formatBookingStatus(status: BookingStatus | string) {
  const labels: Record<string, string> = {
    draft: "Draft",
    pending_payment: "Awaiting buyer payment",
    paid_pending_acceptance: "Waiting for creator decision",
    accepted: "Accepted by creator",
    in_progress: "In progress",
    delivered: "Completion confirmed",
    awaiting_release: "Delivered, awaiting release window",
    disputed: "In dispute review",
    declined: "Declined by creator",
    cancelled: "Cancelled",
    released: "Funds released",
    refunded: "Buyer refunded"
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

export function bookingNextStep(status: BookingStatus | string) {
  const copy: Record<string, string> = {
    pending_payment: "Buyer pays upfront. Funds move into a held state after payment succeeds.",
    paid_pending_acceptance:
      "The creator decides whether to accept this booking. If declined, the buyer is refunded.",
    accepted: "The creator accepted. Delivery can now start.",
    in_progress: "The booking is active. The creator can mark it delivered when complete.",
    awaiting_release:
      "The creator marked delivery complete. Buyer can confirm completion or open a dispute before release.",
    delivered: "Completion is confirmed. Admin can release held funds to the creator.",
    disputed: "Release is frozen while admin reviews the dispute.",
    declined: "The creator declined this booking and held funds were refunded.",
    released: "Held funds were released to the creator.",
    refunded: "Held funds were returned to the buyer.",
    cancelled: "This booking is no longer active."
  };

  return copy[status] ?? "Follow the booking timeline for the latest action.";
}

export function bookingStatusTone(status: BookingStatus | string) {
  if (["released", "delivered"].includes(status)) {
    return "success";
  }
  if (["pending_payment", "paid_pending_acceptance", "awaiting_release"].includes(status)) {
    return "warning";
  }
  if (["disputed", "refunded", "declined", "cancelled"].includes(status)) {
    return "danger";
  }
  return "brand";
}
