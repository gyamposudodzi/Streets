import type { AvailabilitySlot, Booking, BookingEvent, CreatorSummary, Service } from "@streets/types";

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
  return fetchJson<CreatorSummary>(`${apiRoutes.creators}/${creatorId}`);
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

export function createBooking(input: {
  buyer_id: string;
  service_id: string;
  slot_id?: string;
}) {
  return fetchJson<Booking>(apiRoutes.bookings, {
    method: "POST",
    body: JSON.stringify(input)
  });
}
