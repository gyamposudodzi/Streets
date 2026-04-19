import type {
  AdminDashboard,
  AdminOverview,
  AppUser,
  AuthSession,
  AuditLog,
  AvailabilitySlot,
  Booking,
  BookingEvent,
  BookingMessage,
  BookingPaymentState,
  CreatorProfile,
  CreatorSummary,
  Dispute,
  DisputeResolution,
  Payment,
  PaymentIntent,
  HeldFunds,
  Report,
  ReportStatus,
  ReportTargetType,
  Service
} from "@streets/types";

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const apiRoutes = {
  meta: "/api/v1/meta",
  register: "/api/v1/auth/register",
  login: "/api/v1/auth/login",
  creators: "/api/v1/creators",
  services: "/api/v1/services",
  bookings: "/api/v1/bookings"
} as const;

function buildUrl(path: string, query?: Record<string, string | undefined>) {
  const url = new URL(path, apiBaseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

export async function fetchJson<T>(
  path: string,
  options?: RequestInit,
  query?: Record<string, string | undefined>
): Promise<T> {
  const response = await fetch(buildUrl(path, query), {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function listCreators() {
  return fetchJson<CreatorSummary[]>(apiRoutes.creators);
}

export function getCreator(creatorId: string) {
  return fetchJson<CreatorProfile>(`${apiRoutes.creators}/${creatorId}`);
}

export function listServices(query?: {
  q?: string;
  creator_id?: string;
  category?: string;
  fulfillment_type?: string;
}) {
  return fetchJson<Service[]>(apiRoutes.services, undefined, query);
}

export function getService(serviceId: string) {
  return fetchJson<Service>(`${apiRoutes.services}/${serviceId}`);
}

export function listServiceSlots(serviceId: string) {
  return fetchJson<AvailabilitySlot[]>(`${apiRoutes.services}/${serviceId}/slots`);
}

export function getBooking(bookingId: string) {
  return fetchJson<Booking>(`${apiRoutes.bookings}/${bookingId}`);
}

export function listBookingEvents(bookingId: string) {
  return fetchJson<BookingEvent[]>(`${apiRoutes.bookings}/${bookingId}/events`);
}

export function listCreatorBookings(creatorId: string, accessToken: string) {
  return fetchJson<Booking[]>(`${apiRoutes.creators}/${creatorId}/bookings`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function acceptBooking(bookingId: string, accessToken: string) {
  return fetchJson<Booking>(`${apiRoutes.bookings}/${bookingId}/accept`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function cancelBooking(bookingId: string, accessToken: string) {
  return fetchJson<Booking>(`${apiRoutes.bookings}/${bookingId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function startBooking(bookingId: string, accessToken: string) {
  return fetchJson<Booking>(`${apiRoutes.bookings}/${bookingId}/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function deliverBooking(bookingId: string, accessToken: string) {
  return fetchJson<Booking>(`${apiRoutes.bookings}/${bookingId}/deliver`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function completeBooking(bookingId: string, accessToken: string) {
  return fetchJson<Booking>(`${apiRoutes.bookings}/${bookingId}/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function disputeBooking(
  bookingId: string,
  input: {
    reason: string;
    details?: string;
  },
  accessToken: string
) {
  return fetchJson<Dispute>(`${apiRoutes.bookings}/${bookingId}/dispute`, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function getBookingPaymentState(bookingId: string) {
  return fetchJson<BookingPaymentState>(`/api/v1/payments/bookings/${bookingId}`);
}

export function listBookingMessages(bookingId: string, accessToken: string) {
  return fetchJson<BookingMessage[]>(`/api/v1/messages/bookings/${bookingId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function createBookingMessage(
  bookingId: string,
  body: string,
  accessToken: string
) {
  return fetchJson<BookingMessage>(`/api/v1/messages/bookings/${bookingId}`, {
    method: "POST",
    body: JSON.stringify({ body }),
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function createReport(
  input: {
    target_type: ReportTargetType;
    target_id: string;
    reason: string;
    details?: string;
  },
  accessToken: string
) {
  return fetchJson<Report>("/api/v1/reports", {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function createPaymentIntent(bookingId: string, accessToken: string) {
  return fetchJson<PaymentIntent>("/api/v1/payments/create-intent", {
    method: "POST",
    body: JSON.stringify({ booking_id: bookingId }),
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function simulatePaymentSuccess(paymentId: string, accessToken: string) {
  return fetchJson<Payment>(`/api/v1/payments/${paymentId}/simulate-success`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function createBooking(
  input: {
    service_id: string;
    slot_id?: string;
  },
  accessToken: string
) {
  return fetchJson<Booking>(apiRoutes.bookings, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function registerUser(input: {
  email: string;
  phone?: string;
  role?: "user" | "creator" | "admin";
  is_age_verified?: boolean;
}) {
  return fetchJson<AppUser>(apiRoutes.register, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function loginUser(input: { email: string }) {
  return fetchJson<AuthSession>(apiRoutes.login, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function upsertCreatorProfile(
  creatorId: string,
  input: {
    display_name: string;
    bio: string;
    country: string;
    service_region: string;
  },
  accessToken: string
) {
  return fetchJson<CreatorProfile>(`${apiRoutes.creators}/${creatorId}`, {
    method: "PUT",
    body: JSON.stringify(input),
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function createCreatorService(
  creatorId: string,
  input: {
    title: string;
    description: string;
    category: string;
    duration_minutes: number;
    price: number;
    currency: string;
    fulfillment_type: string;
  },
  accessToken: string
) {
  return fetchJson<Service>(`${apiRoutes.services}/creator/${creatorId}`, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function updateCreatorService(
  creatorId: string,
  serviceId: string,
  input: {
    title?: string;
    description?: string;
    category?: string;
    duration_minutes?: number;
    price?: number;
    currency?: string;
    fulfillment_type?: string;
    is_active?: boolean;
  },
  accessToken: string
) {
  return fetchJson<Service>(`${apiRoutes.services}/creator/${creatorId}/${serviceId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function createServiceSlot(
  creatorId: string,
  serviceId: string,
  input: {
    starts_at: string;
    ends_at: string;
  },
  accessToken: string
) {
  return fetchJson<AvailabilitySlot>(`${apiRoutes.services}/creator/${creatorId}/${serviceId}/slots`, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function getAdminOverview(accessToken: string) {
  return fetchJson<AdminOverview>("/api/v1/admin/overview", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function getAdminDashboard(accessToken: string) {
  return fetchJson<AdminDashboard>("/api/v1/admin/dashboard", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function listAdminAuditLogs(accessToken: string) {
  return fetchJson<AuditLog[]>("/api/v1/admin/audit-logs", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function adminReleaseBooking(bookingId: string, accessToken: string) {
  return fetchJson<HeldFunds[]>(`/api/v1/admin/bookings/${bookingId}/release`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function adminRefundBooking(bookingId: string, accessToken: string) {
  return fetchJson<HeldFunds[]>(`/api/v1/admin/bookings/${bookingId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function adminApproveService(serviceId: string, accessToken: string) {
  return fetchJson<Service>(`/api/v1/admin/services/${serviceId}/approve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function adminRejectService(serviceId: string, accessToken: string) {
  return fetchJson<Service>(`/api/v1/admin/services/${serviceId}/reject`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function adminResolveDispute(
  disputeId: string,
  resolution: DisputeResolution,
  accessToken: string
) {
  return fetchJson<Dispute>(`/api/v1/admin/disputes/${disputeId}/resolve`, {
    method: "POST",
    body: JSON.stringify({ resolution }),
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function adminResolveReport(
  reportId: string,
  status: ReportStatus,
  accessToken: string
) {
  return fetchJson<Report>(`/api/v1/admin/reports/${reportId}/resolve`, {
    method: "POST",
    body: JSON.stringify({ status }),
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}
