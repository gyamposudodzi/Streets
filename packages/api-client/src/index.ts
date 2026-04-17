import type {
  AdminDashboard,
  AdminOverview,
  AppUser,
  AuthSession,
  AvailabilitySlot,
  Booking,
  BookingEvent,
  CreatorProfile,
  CreatorSummary,
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
